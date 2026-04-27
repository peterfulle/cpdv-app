import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enrichMpPayment, type MpPaymentRaw } from '@/lib/mpPayments'
import { autoImportMpDeposits } from '@/lib/autoImportMp'

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? process.env.MP_PRIVATE_KEY ?? ''

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })
  }

  // Disparamos el auto-import en segundo plano (throttled).
  // No bloqueamos la respuesta si falla.
  autoImportMpDeposits().catch(() => null)

  const url = new URL('https://api.mercadopago.com/v1/payments/search')
  url.searchParams.set('sort', 'date_created')
  url.searchParams.set('criteria', 'desc')
  url.searchParams.set('limit', '100')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const errBody = await res.text()
    return NextResponse.json(
      { error: `MP API error ${res.status}`, detail: errBody },
      { status: res.status },
    )
  }

  const data = await res.json() as {
    paging?: { total: number; limit: number; offset: number }
    results?: MpPaymentRaw[]
  }

  const movimientos = (data.results ?? []).map(enrichMpPayment)

  const totalDepositado = movimientos
    .filter(m => m.estado === 'approved')
    .reduce((sum, m) => sum + m.monto, 0)

  return NextResponse.json({
    movimientos,
    resumen: {
      total: data.paging?.total ?? movimientos.length,
      totalDepositado: Math.round(totalDepositado),
    },
  })
}
