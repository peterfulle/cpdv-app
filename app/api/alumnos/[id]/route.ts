import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const alumnoId = parseInt(params.id)
  if (isNaN(alumnoId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [alumno, items] = await Promise.all([
    prisma.alumno.findUnique({
      where: { id: alumnoId },
      include: {
        apoderados: true,
        eleccionPoleron: { include: { talla: true } },
        pagos: {
          include: { item: true },
          orderBy: { fecha: 'desc' },
        },
      },
    }),
    prisma.itemPagar.findMany({ orderBy: [{ tipo: 'asc' }, { id: 'asc' }] }),
  ])

  if (!alumno) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const talla = alumno.eleccionPoleron?.talla

  const pagosPorItem = new Map<number, number>()
  for (const p of alumno.pagos) {
    pagosPorItem.set(p.itemId, (pagosPorItem.get(p.itemId) ?? 0) + p.monto)
  }

  const itemsConEstado = items.map((item) => {
    const valorItem = item.tipo === 1 ? (talla?.valor ?? item.valor) : item.valor
    const pagado = pagosPorItem.get(item.id) ?? 0
    const pendiente = Math.max(0, valorItem - pagado)
    return {
      id: item.id,
      nombre: item.nombre,
      valor: valorItem,
      pagado,
      pendiente,
      porcentaje: valorItem > 0 ? Math.round((pagado / valorItem) * 100) : 0,
      tipo: item.tipo,
    }
  })

  return NextResponse.json({
    alumno: {
      id: alumno.id,
      nombre: alumno.nombre,
      apoderados: alumno.apoderados.map((a) => a.nombre),
      tallaPoleron: talla ? { nombre: talla.nombre, valor: talla.valor } : null,
    },
    items: itemsConEstado,
    pagos: alumno.pagos.map((p) => ({
      id: p.id,
      itemId: p.itemId,
      itemNombre: p.item.nombre,
      monto: p.monto,
      comprobante: p.comprobante,
      fecha: p.fecha.toISOString(),
      tipo: p.item.tipo,
    })),
  })
}
