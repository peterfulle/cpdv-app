/**
 * GET  /api/mercadopago/payments         → lista transacciones en nuestra BD
 * POST /api/mercadopago/payments/sync    → sincroniza últimos pagos desde API de MP
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMpPayment } from '@/lib/mercadopago'

// ── GET: lista local ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit   = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const statusF = searchParams.get('status') // 'approved' | 'pending' | etc.

  const transacciones = await prisma.mercadoPagoTransaccion.findMany({
    where:   statusF ? { status: statusF } : undefined,
    take:    limit,
    orderBy: { createdAt: 'desc' },
    include: {
      alumno: { select: { id: true, nombre: true } },
      item:   { select: { id: true, nombre: true, valor: true } },
      pago:   { select: { id: true, fecha: true } },
    },
  })

  return NextResponse.json({ transacciones })
}

// ── POST: sincronizar desde MP API ────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userNivel = (session.user as any)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Buscar en nuestra BD transacciones con paymentId pero status != approved
  // o transacciones sin paymentId creadas en las últimas 72h
  const pendientes = await prisma.mercadoPagoTransaccion.findMany({
    where: {
      OR: [
        { status: 'pending',    createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) } },
        { status: 'in_process', createdAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) } },
        { paymentId: { not: null }, status: { notIn: ['approved', 'cancelled', 'refunded'] } },
      ],
    },
    include: { alumno: true, item: true },
  })

  const resultados: { id: number; prevStatus: string; newStatus: string; pagoId?: number }[] = []

  for (const tx of pendientes) {
    if (!tx.paymentId) continue
    try {
      const payment = await getMpPayment().get({ id: tx.paymentId })
      if (!payment) continue

      const newStatus      = payment.status      ?? tx.status
      const newStatusDetail = payment.status_detail ?? ''

      const updateData: Record<string, unknown> = {
        status:       newStatus,
        statusDetail: newStatusDetail,
        updatedAt:    new Date(),
      }

      let pagoId = tx.pagoId
      if (newStatus === 'approved' && !tx.pagoId) {
        const nuevoPago = await prisma.pago.create({
          data: {
            alumnoId: tx.alumnoId,
            itemId:   tx.itemId,
            monto:    tx.monto,
            fecha:    new Date(payment.date_approved ?? Date.now()),
            comprobante: `mp_${tx.paymentId}`,
          },
        })
        updateData.pagoId = nuevoPago.id
        pagoId = nuevoPago.id
      }

      await prisma.mercadoPagoTransaccion.update({
        where: { id: tx.id },
        data:  updateData,
      })

      resultados.push({ id: tx.id, prevStatus: tx.status, newStatus, pagoId: pagoId ?? undefined })
    } catch {
      // Continuar con el siguiente aunque uno falle
    }
  }

  return NextResponse.json({
    sincronizados: resultados.length,
    resultados,
  })
}
