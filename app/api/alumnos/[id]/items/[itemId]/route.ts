/**
 * PATCH /api/alumnos/[id]/items/[itemId]
 * Marca/desmarca un item como pagado para un alumno.
 *
 * Body: { pagado: boolean }
 *  - pagado: true  → crea un Pago por el monto pendiente del item (si aplica)
 *  - pagado: false → elimina TODOS los pagos del alumno para ese item
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userNivel = (session.user as { nivel?: string } | undefined)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const alumnoId = parseInt(params.id, 10)
  const itemId   = parseInt(params.itemId, 10)
  if (isNaN(alumnoId) || isNaN(itemId)) {
    return NextResponse.json({ error: 'IDs inválidos' }, { status: 400 })
  }

  const body = await req.json().catch(() => null) as { pagado?: boolean } | null
  if (!body || typeof body.pagado !== 'boolean') {
    return NextResponse.json({ error: 'pagado (boolean) requerido' }, { status: 400 })
  }

  // Verificar que el alumno y el item existen
  const [alumno, item, eleccion, pagosExistentes] = await Promise.all([
    prisma.alumno.findUnique({ where: { id: alumnoId } }),
    prisma.itemPagar.findUnique({ where: { id: itemId } }),
    prisma.eleccionPoleron.findUnique({
      where: { alumnoId },
      include: { talla: true },
    }),
    prisma.pago.findMany({ where: { alumnoId, itemId } }),
  ])

  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  if (!item)   return NextResponse.json({ error: 'Item no encontrado' },   { status: 404 })

  const valorItem = item.tipo === 1 ? (eleccion?.talla.valor ?? item.valor) : item.valor

  if (body.pagado) {
    const yaPagado = pagosExistentes.reduce((s: number, p: { monto: number }) => s + p.monto, 0)
    const pendiente = valorItem - yaPagado
    if (pendiente <= 0) {
      return NextResponse.json({ ok: true, accion: 'ya_pagado', pendiente: 0 })
    }
    const pago = await prisma.pago.create({
      data: {
        alumnoId,
        itemId,
        monto: pendiente,
        comprobante: 'manual',
        fecha: new Date(),
      },
    })
    return NextResponse.json({ ok: true, accion: 'creado', pago })
  } else {
    // Marcar como NO pagado: borrar todos los pagos manuales/MP de este item.
    // Si algún Pago está vinculado a un MercadoPagoTransaccion, primero
    // desligamos la relación para evitar violar la FK.
    const pagoIds = pagosExistentes.map((p: { id: number }) => p.id)
    if (pagoIds.length === 0) {
      return NextResponse.json({ ok: true, accion: 'sin_cambios', cantidad: 0 })
    }
    await prisma.mercadoPagoTransaccion.updateMany({
      where: { pagoId: { in: pagoIds } },
      data:  { pagoId: null },
    })
    const eliminados = await prisma.pago.deleteMany({
      where: { id: { in: pagoIds } },
    })
    return NextResponse.json({ ok: true, accion: 'eliminados', cantidad: eliminados.count })
  }
}
