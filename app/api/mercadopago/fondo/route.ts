import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enrichMpPayment, type MpPaymentRaw } from '@/lib/mpPayments'
import { autoImportMpDeposits } from '@/lib/autoImportMp'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''

export interface FondoDepositoEnriched {
  id: number
  fecha: string
  monto: number
  interesGanado: number
  descripcion: string
  pagador: { nombre: string | null; email: string | null; identificacion: string | null }
  metodo: string | null
  bancoOrigen: string | null
  issuerId: string | null
  bankTransferId: string | null
  transactionId: string | null
  esTransferenciaBancaria: boolean
}

// Fetch all approved payments from MP and compute per-deposit compound interest
async function calcularSaldoDesdeDepositos(tasaAnual: number): Promise<{
  depositos: FondoDepositoEnriched[]
  totalDepositado: number
  totalInteres: number
  saldoTotal: number
  interesPorSegundo: number
  timestampCalculo: string
}> {
  const now = new Date()

  if (!MP_TOKEN) {
    return { depositos: [], totalDepositado: 0, totalInteres: 0, saldoTotal: 0, interesPorSegundo: 0, timestampCalculo: now.toISOString() }
  }

  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'asc')
  url.searchParams.set('limit', '100')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
    next: { revalidate: 0 }, // always fresh
  })
  if (!res.ok) {
    return { depositos: [], totalDepositado: 0, totalInteres: 0, saldoTotal: 0, interesPorSegundo: 0, timestampCalculo: now.toISOString() }
  }

  const data = await res.json() as { results?: MpPaymentRaw[] }
  const aprobados = (data.results ?? []).filter(p => p.status === 'approved')

  let totalDepositado = 0
  let totalInteres = 0
  // interesPorSegundo = sum of each deposit's instantaneous rate
  let interesPorSegundo = 0

  const depositos: FondoDepositoEnriched[] = aprobados.map(p => {
    const enr = enrichMpPayment(p)
    const fecha = new Date(p.date_approved ?? p.date_created)
    const dias = (now.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
    const interesGanado = p.transaction_amount * (Math.pow(1 + tasaAnual, dias / 365) - 1)
    const ips = (p.transaction_amount * tasaAnual) / (365 * 24 * 60 * 60)
    totalDepositado += p.transaction_amount
    totalInteres += interesGanado
    interesPorSegundo += ips
    return {
      id: enr.id,
      fecha: enr.fecha,
      monto: enr.monto,
      interesGanado: Math.round(interesGanado),
      descripcion: enr.descripcion || 'Transferencia recibida',
      pagador: enr.pagador,
      metodo: enr.metodo,
      bancoOrigen: enr.bancoOrigen,
      issuerId: enr.issuerId,
      bankTransferId: enr.bankTransferId,
      transactionId: enr.transactionId,
      esTransferenciaBancaria: enr.esTransferenciaBancaria,
    }
  })

  return {
    depositos: depositos.reverse(), // newest first
    totalDepositado: Math.round(totalDepositado),
    totalInteres: Math.round(totalInteres),
    saldoTotal: Math.round(totalDepositado + totalInteres),
    interesPorSegundo,
    timestampCalculo: now.toISOString(),
  }
}

// GET – compute real-time balance from MP payment history
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Auto-importa nuevas transferencias TEF como OtroIngreso (throttled).
  autoImportMpDeposits().catch(() => null)

  const config = await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })

  const tasaAnual = config.tasaAnualPct / 100
  const calc = await calcularSaldoDesdeDepositos(tasaAnual)

  // ── Saldo REAL cacheado desde release_report de MP ──────────────────
  // Si tenemos saldoReal sincronizado, lo usamos como base y extrapolamos
  // el interés acumulado desde esa fecha. Si no, usamos el cálculo per-depósito.
  let saldoBase: number
  let interesEstimadoExtra = 0
  let interesPorSegundoBase: number
  let usandoSaldoReal = false
  let fechaSaldoReal: string | null = null

  if (config.saldoReal && config.saldoRealFecha) {
    const segundosDesdeSync = (Date.now() - config.saldoRealFecha.getTime()) / 1000
    interesPorSegundoBase = (config.saldoReal * tasaAnual) / (365 * 24 * 60 * 60)
    interesEstimadoExtra  = interesPorSegundoBase * segundosDesdeSync
    saldoBase             = config.saldoReal + interesEstimadoExtra
    usandoSaldoReal       = true
    fechaSaldoReal        = config.saldoRealFecha.toISOString()
  } else {
    saldoBase             = calc.saldoTotal
    interesPorSegundoBase = calc.interesPorSegundo
  }

  // Projections from the current saldoTotal forward
  const proyecciones = [30, 60, 90, 180, 365].map(dias => ({
    dias,
    saldo:  Math.round(saldoBase * Math.pow(1 + tasaAnual, dias / 365)),
    interes: Math.round(saldoBase * (Math.pow(1 + tasaAnual, dias / 365) - 1)),
  }))

  // Enriquecer cada depósito con el OtroIngreso vinculado (si fue importado)
  // para mostrar el nombre editado por el admin (ej: "Peter Fulle - Cuota 3").
  const comprobantes = calc.depositos.map(d => `mp_${d.id}`)
  const ingresosLink = comprobantes.length > 0
    ? await prisma.otroIngreso.findMany({
        where: { comprobante: { in: comprobantes } },
        select: { id: true, comprobante: true, nombre: true },
      })
    : []
  const linkMap = new Map(ingresosLink.map(i => [i.comprobante, i]))
  const depositosConLink = calc.depositos.map(d => {
    const link = linkMap.get(`mp_${d.id}`)
    return {
      ...d,
      otroIngresoId:     link?.id ?? null,
      nombreEditado:     link?.nombre ?? null,
    }
  })

  return NextResponse.json({
    config: {
      tasaAnualPct: config.tasaAnualPct,
      notas: config.notas,
      updatedAt: config.updatedAt.toISOString(),
    },
    saldoReal: {
      activo: usandoSaldoReal,
      saldoSincronizado: config.saldoReal ?? null,
      fechaSincronizacion: fechaSaldoReal,
      ultimaSincronizacion: config.ultimaSincronizacion?.toISOString() ?? null,
      interesRealAbonado: config.interesRealAcumulado ?? null,
      interesEstimadoDesdeSync: Math.round(interesEstimadoExtra),
    },
    stats: {
      totalDepositado: calc.totalDepositado,
      totalInteres:    Math.round(usandoSaldoReal
        ? (config.interesRealAcumulado ?? 0) + interesEstimadoExtra
        : calc.totalInteres),
      saldoTotal:      Math.round(saldoBase),
      interesPorSegundo: interesPorSegundoBase,
      cantidadDepositos: calc.depositos.length,
      timestampCalculo: new Date().toISOString(),
    },
    proyecciones,
    depositos: depositosConLink,
  })
}

// PATCH – update TNA% (only user-configurable field now)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json() as { tasaAnualPct?: number; notas?: string }

  const data: Record<string, unknown> = {}
  if (body.tasaAnualPct !== undefined) data.tasaAnualPct = Number(body.tasaAnualPct)
  if (body.notas !== undefined) data.notas = String(body.notas)

  const config = await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  })

  return NextResponse.json({ ok: true, config })
}
