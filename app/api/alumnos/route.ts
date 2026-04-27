import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [alumnos, items, elecciones] = await Promise.all([
    prisma.alumno.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        apoderados: true,
        eleccionPoleron: { include: { talla: true } },
        pagos: { include: { item: true }, orderBy: { fecha: 'desc' } },
      },
    }),
    prisma.itemPagar.findMany({ orderBy: [{ tipo: 'desc' }, { id: 'asc' }] }),
    prisma.eleccionPoleron.findMany({ include: { talla: true } }),
  ])

  const tallaMap = new Map(elecciones.map((e) => [e.alumnoId, e.talla]))

  const result = alumnos.map((a) => {
    const talla = tallaMap.get(a.id)

    // Calculate total debt (items they need to pay)
    let totalDeuda = 0
    let totalPagado = 0

    const pagosPorItem = new Map<number, number>()
    for (const p of a.pagos) {
      const prev = pagosPorItem.get(p.itemId) ?? 0
      pagosPorItem.set(p.itemId, prev + p.monto)
      totalPagado += p.monto
    }

    for (const item of items) {
      const valorItem = item.tipo === 1 ? (talla?.valor ?? item.valor) : item.valor
      totalDeuda += valorItem
    }

    const saldoPendiente = totalDeuda - totalPagado
    const estadoGeneral =
      saldoPendiente <= 0 ? 'paid' : totalPagado > 0 ? 'partial' : 'pending'

    return {
      id: a.id,
      nombre: a.nombre,
      apoderados: a.apoderados.map((ap) => ap.nombre),
      tallaPoleron: talla ? { nombre: talla.nombre, valor: talla.valor } : null,
      totalPagado,
      totalDeuda,
      saldoPendiente: Math.max(0, saldoPendiente),
      estadoGeneral,
      pagos: a.pagos.map((p) => ({
        id: p.id,
        itemId: p.itemId,
        itemNombre: p.item.nombre,
        itemValor: p.item.tipo === 1 ? (talla?.valor ?? p.item.valor) : p.item.valor,
        monto: p.monto,
        comprobante: p.comprobante,
        fecha: p.fecha.toISOString(),
        tipo: p.item.tipo,
      })),
    }
  })

  return NextResponse.json({ alumnos: result, items })
}
