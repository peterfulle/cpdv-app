/**
 * GET /api/mercadopago/balance-live
 *
 * Endpoint ligero y polleable cada ~5s. Devuelve:
 *   - saldo actual extrapolado (cache release_report + interés segundo a segundo)
 *   - últimos N depósitos APROBADOS recibidos en MP (vía /v1/payments/search)
 *   - timestamp de cálculo
 *
 * NO dispara auto-import (eso lo hace /api/dashboard).
 * NO toca /v1/account/release_report (lento).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enrichMpPayment, type MpPaymentRaw } from '@/lib/mpPayments'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 100)

  const config = await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })

  // ── Saldo extrapolado en tiempo real ───────────────────────────────
  const tasaAnual = config.tasaAnualPct / 100
  let saldoLive = 0
  let interesPorSegundo = 0
  let usandoSaldoReal = false
  let baseFecha: string | null = null

  if (config.saldoReal && config.saldoRealFecha) {
    const segundos = (Date.now() - config.saldoRealFecha.getTime()) / 1000
    interesPorSegundo = (config.saldoReal * tasaAnual) / (365 * 24 * 60 * 60)
    saldoLive         = Math.round(config.saldoReal + interesPorSegundo * segundos)
    usandoSaldoReal   = true
    baseFecha         = config.saldoRealFecha.toISOString()
  }

  // ── Últimos pagos recibidos (live de MP) ───────────────────────────
  let depositos: ReturnType<typeof enrichMpPayment>[] = []
  if (MP_TOKEN) {
    try {
      const url = new URL('https://api.mercadopago.com/v1/payments/search')
      url.searchParams.set('sort', 'date_created')
      url.searchParams.set('criteria', 'desc')
      url.searchParams.set('limit', String(limit))
      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
        cache: 'no-store',
      })
      if (r.ok) {
        const data = await r.json() as { results?: MpPaymentRaw[] }
        depositos = (data.results ?? [])
          .filter(p => p.status === 'approved')
          .map(enrichMpPayment)
      }
    } catch {
      // Silent — saldo cacheado sigue válido
    }
  }

  return NextResponse.json({
    saldoLive,
    interesPorSegundo,
    usandoSaldoReal,
    baseFecha,
    ultimaSincronizacion: config.ultimaSincronizacion?.toISOString() ?? null,
    depositos,
    cantidadDepositos: depositos.length,
    timestampCalculo: new Date().toISOString(),
  })
}
