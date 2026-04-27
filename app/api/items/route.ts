/**
 * GET /api/items
 * Lista todos los items disponibles para pagar.
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.itemPagar.findMany({
    orderBy: [{ tipo: 'desc' }, { id: 'asc' }],
    include: { categoria: true },
  })

  return NextResponse.json({
    items: items.map(i => ({
      id:        i.id,
      nombre:    i.nombre,
      valor:     i.valor,
      tipo:      i.tipo,
      categoria: i.categoria.nombre,
    })),
  })
}
