/**
 * Auto-importa depósitos aprobados desde MercadoPago como OtroIngreso
 * cuando NO provienen del flujo checkout (no tienen MercadoPagoTransaccion asociada)
 * y no han sido importados aún.
 *
 * Dedup key: comprobante = "mp_<paymentId>"
 */
import { prisma } from '@/lib/prisma'
import { buildOtroIngresoNombre, type MpPaymentRaw } from '@/lib/mpPayments'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? process.env.MP_PRIVATE_KEY ?? ''

let lastRunAt = 0
const CACHE_MS = 30_000  // como máximo 1 corrida cada 30s

export async function autoImportMpDeposits(opts: { force?: boolean } = {}): Promise<{
  importados: number
  saltados: number
  detalles: Array<{ id: number; monto: number; nombre: string }>
}> {
  if (!MP_TOKEN) return { importados: 0, saltados: 0, detalles: [] }

  if (!opts.force && Date.now() - lastRunAt < CACHE_MS) {
    return { importados: 0, saltados: 0, detalles: [] }
  }
  lastRunAt = Date.now()

  let aprobados: MpPaymentRaw[] = []
  try {
    const url = new URL('https://api.mercadopago.com/v1/payments/search')
    url.searchParams.set('sort', 'date_created')
    url.searchParams.set('criteria', 'desc')
    url.searchParams.set('limit', '100')

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
      cache: 'no-store',
    })
    if (!res.ok) return { importados: 0, saltados: 0, detalles: [] }
    const data = await res.json() as { results?: MpPaymentRaw[] }
    aprobados = (data.results ?? []).filter(p => p.status === 'approved')
  } catch {
    return { importados: 0, saltados: 0, detalles: [] }
  }

  if (aprobados.length === 0) return { importados: 0, saltados: 0, detalles: [] }

  const comprobantes = aprobados.map(p => `mp_${p.id}`)
  const paymentIds   = aprobados.map(p => String(p.id))

  // Comprobamos en paralelo qué existe ya:
  // - como OtroIngreso (importación previa)
  // - como Pago (vino del checkout flow → comprobante = mp_<paymentId>)
  // - como MercadoPagoTransaccion (vinculado al checkout aunque aún no haya pago)
  const [otrosExist, pagosExist, mpTxExist] = await Promise.all([
    prisma.otroIngreso.findMany({
      where: { comprobante: { in: comprobantes } },
      select: { comprobante: true },
    }),
    prisma.pago.findMany({
      where: { comprobante: { in: comprobantes } },
      select: { comprobante: true },
    }),
    prisma.mercadoPagoTransaccion.findMany({
      where: { paymentId: { in: paymentIds } },
      select: { paymentId: true },
    }),
  ])

  const yaImportados = new Set([
    ...otrosExist.map(o => o.comprobante),
    ...pagosExist.map(p => p.comprobante).filter((c): c is string => !!c),
    ...mpTxExist.map(t => `mp_${t.paymentId}`),
  ])

  const detalles: Array<{ id: number; monto: number; nombre: string }> = []
  let saltados = 0

  for (const p of aprobados) {
    const comprobante = `mp_${p.id}`
    if (yaImportados.has(comprobante)) {
      saltados++
      continue
    }
    const nombre = buildOtroIngresoNombre(p)
    const fecha  = new Date(p.date_approved ?? p.date_created)
    try {
      await prisma.otroIngreso.create({
        data: {
          nombre,
          monto: Math.round(p.transaction_amount),
          comprobante,
          fecha,
        },
      })
      detalles.push({ id: p.id, monto: p.transaction_amount, nombre })
    } catch {
      saltados++
    }
  }

  return { importados: detalles.length, saltados, detalles }
}
