/**
 * PATCH /api/mercadopago/payments/[paymentId]/note
 * Permite renombrar el OtroIngreso auto-importado correspondiente al pago MP.
 * Si no existe aún, lo crea consultando el pago en MP.
 *
 * Body: { nombre: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { MpPaymentRaw } from '@/lib/mpPayments'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? process.env.MP_PRIVATE_KEY ?? ''

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userNivel = (session.user as { nivel?: string } | undefined)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const paymentId = String(params.id).replace(/[^0-9]/g, '')
  if (!paymentId) {
    return NextResponse.json({ error: 'paymentId inválido' }, { status: 400 })
  }

  const body = await req.json().catch(() => null) as { nombre?: string } | null
  const nombre = body?.nombre?.trim()
  if (!nombre || nombre.length < 2 || nombre.length > 200) {
    return NextResponse.json({ error: 'nombre requerido (2-200 chars)' }, { status: 400 })
  }

  const comprobante = `mp_${paymentId}`

  let existente = await prisma.otroIngreso.findFirst({ where: { comprobante } })

  // Si no existe el OtroIngreso aún (auto-import no ha corrido), lo creamos
  // consultando el pago directo en la API de MP.
  if (!existente) {
    if (!MP_TOKEN) {
      return NextResponse.json(
        { error: 'No se encontró el pago y no hay MP_ACCESS_TOKEN configurado' },
        { status: 500 },
      )
    }

    let payment: MpPaymentRaw | null = null
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
        cache: 'no-store',
      })
      if (res.ok) payment = await res.json() as MpPaymentRaw
    } catch {
      // ignore
    }

    if (!payment) {
      return NextResponse.json(
        { error: `Pago ${paymentId} no encontrado en MercadoPago` },
        { status: 404 },
      )
    }
    if (payment.status !== 'approved') {
      return NextResponse.json(
        { error: `Pago ${paymentId} no está aprobado (status: ${payment.status})` },
        { status: 400 },
      )
    }

    existente = await prisma.otroIngreso.create({
      data: {
        nombre,  // ya usamos directamente el nombre que el admin escribió
        monto: Math.round(payment.transaction_amount),
        comprobante,
        fecha: new Date(payment.date_approved ?? payment.date_created),
      },
    })

    return NextResponse.json({ ok: true, created: true, otroIngreso: existente })
  }

  const actualizado = await prisma.otroIngreso.update({
    where: { id: existente.id },
    data:  { nombre },
  })

  return NextResponse.json({ ok: true, created: false, otroIngreso: actualizado })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const paymentId = String(params.id).replace(/[^0-9]/g, '')
  const comprobante = `mp_${paymentId}`

  const ingreso = await prisma.otroIngreso.findFirst({ where: { comprobante } })
  return NextResponse.json({ otroIngreso: ingreso })
}
