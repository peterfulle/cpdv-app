/**
 * GET /api/public/cuotas
 * Devuelve alumnos con cuotas pendientes (sin autenticación).
 * ?alumnoId=X → devuelve los items pendientes de ese alumno específico.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const alumnoIdParam = req.nextUrl.searchParams.get('alumnoId')

  // ── Items pendientes de un alumno específico ───────────────────────
  if (alumnoIdParam) {
    const id = parseInt(alumnoIdParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const alumno = await prisma.alumno.findUnique({
      where: { id },
      include: { pagos: { select: { itemId: true } } },
    })

    if (!alumno) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }

    const paidItemIds = alumno.pagos.map((p) => p.itemId)

    const items = await prisma.itemPagar.findMany({
      where: paidItemIds.length > 0 ? { id: { notIn: paidItemIds } } : {},
      include: { categoria: true },
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({
      nombre: alumno.nombre,
      items: items.map((i) => ({
        id:        i.id,
        nombre:    i.nombre,
        valor:     i.valor,
        categoria: i.categoria.nombre,
      })),
    })
  }

  // ── Lista de todos los alumnos con al menos 1 pending ─────────────
  const totalItems = await prisma.itemPagar.count()

  const alumnos = await prisma.alumno.findMany({
    select: {
      id:    true,
      nombre: true,
      pagos:  { select: { itemId: true } },
    },
    orderBy: { nombre: 'asc' },
  })

  const result = alumnos
    .map((a) => ({
      id:         a.id,
      nombre:     a.nombre,
      pagados:    a.pagos.length,
      pendientes: totalItems - a.pagos.length,
    }))
    .filter((a) => a.pendientes > 0)

  return NextResponse.json({ alumnos: result })
}
