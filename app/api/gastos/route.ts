/**
 * /api/gastos
 *
 *   GET   ?mes=YYYY-MM&q=texto&categoria=X   → listado filtrado + balance consolidado
 *   POST  multipart/form-data | application/json → registra una nueva salida
 *   DELETE ?id=N | ?all=true (admin)         → elimina una o todas
 *
 * Modelo de "salidas" del curso:
 *   - emisor       quién paga (default "Tesorería MP")
 *   - beneficiario a quién va el dinero (proveedor, persona, etc)
 *   - categoria    libre (Material, Aula, Premios, etc)
 *   - metodoPago   mp_transfer | efectivo | tarjeta | otro
 *   - descripcion  glosa libre
 *   - comprobante  archivo opcional (img / pdf) → guardado en UPLOAD_DIR
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'public/comprobantes'
const MAX_BYTES  = 5 * 1024 * 1024  // 5 MB

// ── GET ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mes = searchParams.get('mes')         // YYYY-MM
  const q   = searchParams.get('q')?.trim()
  const cat = searchParams.get('categoria')

  // Filtro por mes (rango UTC)
  let dateFilter: { gte: Date; lt: Date } | undefined
  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number)
    dateFilter = {
      gte: new Date(Date.UTC(y, m - 1, 1)),
      lt:  new Date(Date.UTC(y, m, 1)),
    }
  }

  const where: Record<string, unknown> = {}
  if (dateFilter) where.fecha = dateFilter
  if (cat)        where.categoria = cat
  if (q) {
    where.OR = [
      { nombre:        { contains: q, mode: 'insensitive' } },
      { beneficiario:  { contains: q, mode: 'insensitive' } },
      { descripcion:   { contains: q, mode: 'insensitive' } },
      { categoria:     { contains: q, mode: 'insensitive' } },
    ]
  }

  const [items, totalGeneralAgg, totalGeneralCount, todosParaMeses] = await Promise.all([
    prisma.gasto.findMany({ where, orderBy: { fecha: 'desc' }, take: 500 }),
    prisma.gasto.aggregate({ _sum: { monto: true } }),
    prisma.gasto.count(),
    prisma.gasto.findMany({
      select: { fecha: true, monto: true, categoria: true },
      orderBy: { fecha: 'desc' },
    }),
  ])

  const totalFiltrado = items.reduce((s, g) => s + g.monto, 0)

  // Consolidado por mes
  const porMes = new Map<string, { total: number; cantidad: number }>()
  for (const g of todosParaMeses) {
    const k = g.fecha.toISOString().slice(0, 7)
    const cur = porMes.get(k) ?? { total: 0, cantidad: 0 }
    cur.total += g.monto
    cur.cantidad += 1
    porMes.set(k, cur)
  }
  const meses = Array.from(porMes.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([m, v]) => ({ mes: m, total: v.total, cantidad: v.cantidad }))

  // Consolidado por categoría
  const porCat = new Map<string, { total: number; cantidad: number }>()
  for (const g of todosParaMeses) {
    const k = g.categoria || 'Otros'
    const cur = porCat.get(k) ?? { total: 0, cantidad: 0 }
    cur.total += g.monto
    cur.cantidad += 1
    porCat.set(k, cur)
  }
  const categorias = Array.from(porCat.entries())
    .map(([nombre, v]) => ({ nombre, total: v.total, cantidad: v.cantidad }))
    .sort((a, b) => b.total - a.total)

  return NextResponse.json({
    items,
    filtro: {
      mes:       mes ?? null,
      q:         q ?? null,
      categoria: cat ?? null,
      cantidad:  items.length,
      total:     totalFiltrado,
    },
    consolidado: {
      total:     totalGeneralAgg._sum.monto ?? 0,
      cantidad:  totalGeneralCount,
      meses,
      categorias,
    },
  })
}

// ── POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const ct = req.headers.get('content-type') ?? ''
  let nombre = '', monto = 0, fechaStr = ''
  let emisor = 'Tesorería MP', beneficiario = '', categoria = 'Otros'
  let metodoPago = 'mp_transfer', descripcion = ''
  let comprobantePath: string | null = null

  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData()
    nombre        = String(fd.get('nombre') ?? '').trim()
    monto         = Number(String(fd.get('monto') ?? '0').replace(/[^\d-]/g, ''))
    fechaStr      = String(fd.get('fecha') ?? '').trim()
    emisor        = String(fd.get('emisor') ?? 'Tesorería MP').trim() || 'Tesorería MP'
    beneficiario  = String(fd.get('beneficiario') ?? '').trim()
    categoria     = String(fd.get('categoria') ?? 'Otros').trim() || 'Otros'
    metodoPago    = String(fd.get('metodoPago') ?? 'mp_transfer').trim() || 'mp_transfer'
    descripcion   = String(fd.get('descripcion') ?? '').trim()

    const file = fd.get('comprobante')
    if (file && typeof file === 'object' && 'arrayBuffer' in file) {
      const f = file as File
      if (f.size > 0) {
        if (f.size > MAX_BYTES) {
          return NextResponse.json({ error: 'Archivo > 5MB' }, { status: 400 })
        }
        const ext = path.extname(f.name).toLowerCase().slice(0, 6) || ''
        const safeExt = /^\.(png|jpe?g|gif|webp|pdf)$/i.test(ext) ? ext : '.bin'
        const fileName = `gasto_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${safeExt}`
        const dirAbs = path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(process.cwd(), UPLOAD_DIR)
        await mkdir(dirAbs, { recursive: true })
        const buf = Buffer.from(await f.arrayBuffer())
        await writeFile(path.join(dirAbs, fileName), buf)
        comprobantePath = `/comprobantes/${fileName}`
      }
    }
  } else {
    const body = await req.json()
    nombre        = String(body.nombre ?? '').trim()
    monto         = Number(body.monto ?? 0)
    fechaStr      = String(body.fecha ?? '').trim()
    emisor        = String(body.emisor ?? 'Tesorería MP').trim() || 'Tesorería MP'
    beneficiario  = String(body.beneficiario ?? '').trim()
    categoria     = String(body.categoria ?? 'Otros').trim() || 'Otros'
    metodoPago    = String(body.metodoPago ?? 'mp_transfer').trim() || 'mp_transfer'
    descripcion   = String(body.descripcion ?? '').trim()
  }

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: 'Concepto requerido (>=2 caracteres)' }, { status: 400 })
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }
  const fecha = fechaStr ? new Date(fechaStr) : new Date()
  if (Number.isNaN(fecha.getTime())) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  const created = await prisma.gasto.create({
    data: {
      nombre,
      monto: Math.round(monto),
      fecha,
      emisor,
      beneficiario,
      categoria,
      metodoPago,
      descripcion,
      comprobante: comprobantePath,
    },
  })

  return NextResponse.json({ ok: true, gasto: created }, { status: 201 })
}

// ── DELETE ────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userNivel = (session.user as any)?.nivel
  const { searchParams } = new URL(req.url)
  const id  = searchParams.get('id')
  const all = searchParams.get('all') === 'true'

  if (all) {
    if (userNivel !== 'Administrador') {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }
    const r = await prisma.gasto.deleteMany({})
    return NextResponse.json({ ok: true, eliminados: r.count })
  }

  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })
  await prisma.gasto.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
