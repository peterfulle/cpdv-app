import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const pagoSchema = z.object({
  tipo: z.enum(['alumno', 'otro']),
  monto: z.number().min(0),
  alumnoId: z.number().optional(),
  categoriaId: z.number().optional(),
  conceptoOtro: z.string().optional(),
  comprobanteNombre: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const alumnoId = searchParams.get('alumnoId')
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const pagos = await prisma.pago.findMany({
    where: alumnoId ? { alumnoId: parseInt(alumnoId) } : undefined,
    take: limit,
    orderBy: { fecha: 'desc' },
    include: { alumno: true, item: true },
  })

  return NextResponse.json({
    pagos: pagos.map((p) => ({
      id: p.id,
      alumnoNombre: p.alumno.nombre,
      alumnoId: p.alumnoId,
      itemNombre: p.item.nombre,
      itemId: p.itemId,
      monto: p.monto,
      comprobante: p.comprobante,
      fecha: p.fecha.toISOString(),
      tipo: p.item.tipo,
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
    const contentType = req.headers.get('content-type') ?? ''
    let body: Record<string, unknown>
    let comprobanteNombre = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(([, v]) => typeof v === 'string')
      ) as Record<string, unknown>

      const file = formData.get('comprobante') as File | null
      if (file && file.size > 0) {
        const id = body.tipo === 'otro' ? 'otro' : body.alumnoId
        const ext = file.name.split('.').pop()
        comprobanteNombre = `pago_${Date.now()}_${id}.${ext}`
        const uploadDir = path.join(process.cwd(), 'public', 'comprobantes')
        await mkdir(uploadDir, { recursive: true })
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(path.join(uploadDir, comprobanteNombre), buffer)
      }
    } else {
      body = await req.json()
    }

    const parsed = pagoSchema.parse({
      tipo: body.tipo,
      monto: Number(body.monto),
      alumnoId: body.alumnoId ? Number(body.alumnoId) : undefined,
      categoriaId: body.categoriaId ? Number(body.categoriaId) : undefined,
      conceptoOtro: body.conceptoOtro as string | undefined,
    })

    if (parsed.tipo === 'otro') {
      if (!parsed.conceptoOtro) {
        return NextResponse.json({ error: 'Concepto requerido' }, { status: 400 })
      }
      const ingreso = await prisma.otroIngreso.create({
        data: {
          nombre: parsed.conceptoOtro,
          monto: parsed.monto,
          comprobante: comprobanteNombre,
          fecha: new Date(),
        },
      })
      return NextResponse.json({ ok: true, ingreso })
    }

    // Tipo = alumno: auto-distribute payment across pending items
    if (!parsed.alumnoId || !parsed.categoriaId) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const items = await prisma.itemPagar.findMany({
      where: { tipo: parsed.categoriaId },
      orderBy: { id: 'asc' },
    })

    const eleccion = await prisma.eleccionPoleron.findUnique({
      where: { alumnoId: parsed.alumnoId },
      include: { talla: true },
    })

    let saldo = parsed.monto
    const pagosCreadados: number[] = []

    for (const item of items) {
      if (saldo <= 0) break
      const valorItem = item.tipo === 1 ? (eleccion?.talla.valor ?? item.valor) : item.valor

      const yaPaymentAgg = await prisma.pago.aggregate({
        where: { alumnoId: parsed.alumnoId, itemId: item.id },
        _sum: { monto: true },
      })
      const yaPagado = yaPaymentAgg._sum.monto ?? 0
      const pendiente = valorItem - yaPagado

      if (pendiente <= 0) continue

      const aRegistrar = Math.min(saldo, pendiente)
      const pago = await prisma.pago.create({
        data: {
          alumnoId: parsed.alumnoId,
          itemId: item.id,
          monto: aRegistrar,
          comprobante: comprobanteNombre || null,
          fecha: new Date(),
        },
      })
      pagosCreadados.push(pago.id)
      saldo -= aRegistrar
    }

    return NextResponse.json({ ok: true, pagosCreados: pagosCreadados.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error procesando pago' }, { status: 500 })
  }
}
