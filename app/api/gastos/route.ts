import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const gastoSchema = z.object({
  nombre: z.string().min(1).max(100),
  monto: z.number().min(1),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const gastos = await prisma.gasto.findMany({
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json({
    gastos: gastos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      monto: g.monto,
      fecha: g.fecha.toISOString(),
      comprobante: g.comprobante,
    })),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userNivel = (session.user as any)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const nombre = formData.get('nombre') as string
    const monto = Number(formData.get('monto'))

    const parsed = gastoSchema.parse({ nombre, monto })

    let comprobanteNombre = ''
    const file = formData.get('comprobante') as File | null
    if (file && file.size > 0) {
      const ext = file.name.split('.').pop()
      comprobanteNombre = `gasto_${Date.now()}.${ext}`
      const uploadDir = path.join(process.cwd(), 'public', 'comprobantes')
      await mkdir(uploadDir, { recursive: true })
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(uploadDir, comprobanteNombre), buffer)
    }

    const gasto = await prisma.gasto.create({
      data: {
        nombre: parsed.nombre,
        monto: parsed.monto,
        comprobante: comprobanteNombre || null,
        fecha: new Date(),
      },
    })

    return NextResponse.json({ ok: true, gasto })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error registrando gasto' }, { status: 500 })
  }
}
