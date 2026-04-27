/**
 * GET /api/mercadopago/transferencias-emitidas
 *
 * Retorna las transferencias SALIENTES (retiros + transferencias MP→tercero
 * + reembolsos) de la cuenta MercadoPago, con detalle/glosa por movimiento.
 *
 * La fuente es el `release_report` oficial de MP, parseado y cacheado en
 * `FondoConfig.movimientosOutJson`. Si el cache está stale (> STALE_MS) y
 * no hay un sync en curso, dispara uno en background — pero responde de
 * inmediato con lo que tenga.
 *
 * `?refresh=1` fuerza un sync inmediato (espera a que termine, ~30-60s).
 *
 * NOTA: el release_report de MP tiene un retraso natural de hasta 24h
 * (incluye solo movimientos hasta 23:59:59 de "ayer"). Para "real-time"
 * absoluto en salidas no hay API pública de MP — esto es lo más fresco
 * que MP entrega.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''
const MP_BASE  = 'https://api.mercadopago.com'
const STALE_MS = 6 * 60 * 60 * 1000  // 6h → considerar stale

interface MovOut {
  fecha: string
  sourceId: string
  descripcion: string
  glosa: string
  monto: number
  saldoDespues: number
}

// Estado en proceso para evitar lanzar múltiples sync simultáneos
let syncInProgress = false

async function dispararSyncEnBackground(origin: string) {
  if (syncInProgress) return
  syncInProgress = true
  try {
    // Crear un task de release_report
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    yesterday.setUTCHours(23, 59, 59, 0)
    const beginDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    beginDate.setUTCHours(0, 0, 0, 0)

    const createRes = await fetch(`${MP_BASE}/v1/account/release_report`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        begin_date: beginDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
        end_date:   yesterday.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      }),
    })
    if (!createRes.ok) return
    const task = await createRes.json() as { id: number }

    // Polling hasta que esté listo (max 90s)
    const maxWait = Date.now() + 90_000
    while (Date.now() < maxWait) {
      await new Promise(r => setTimeout(r, 5000))
      const r = await fetch(`${MP_BASE}/v1/account/release_report/task/${task.id}`, {
        headers: { Authorization: `Bearer ${MP_TOKEN}` },
      })
      if (!r.ok) continue
      const t = await r.json() as { status: string }
      if (t.status === 'processed') {
        // Llamar al endpoint GET /sync que parsea y guarda
        await fetch(`${origin}/api/mercadopago/fondo/sync?taskId=${task.id}`, {
          headers: { 'x-internal': '1' },
        }).catch(() => null)
        break
      }
      if (t.status === 'failed' || t.status === 'error') break
    }
  } finally {
    syncInProgress = false
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const config = await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })

  let movimientos: MovOut[] = []
  if (config.movimientosOutJson) {
    try {
      movimientos = JSON.parse(config.movimientosOutJson) as MovOut[]
    } catch {
      movimientos = []
    }
  }

  const ultimaSync = config.ultimaSincronizacion
  const ageMs = ultimaSync ? Date.now() - ultimaSync.getTime() : Infinity
  const stale = ageMs > STALE_MS

  // Auto-sync background si está stale o nunca se sincronizó
  if (stale && MP_TOKEN) {
    const origin = req.nextUrl.origin
    dispararSyncEnBackground(origin).catch(() => null)
  }

  return NextResponse.json({
    movimientos,
    total: config.totalGastosMp ?? 0,
    cantidad: movimientos.length,
    ultimaSincronizacion: ultimaSync?.toISOString() ?? null,
    edadCacheSegundos: ultimaSync ? Math.round(ageMs / 1000) : null,
    stale,
    sincronizandoEnBackground: stale && syncInProgress,
    nota: 'release_report MP incluye movimientos hasta 23:59 del día anterior.',
  })
}
