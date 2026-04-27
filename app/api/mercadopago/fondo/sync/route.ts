import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MP_TOKEN = process.env.MP_ACCESS_TOKEN ?? ''
const MP_BASE  = 'https://api.mercadopago.com'

interface ReportTask {
  id: number
  status: string
  file_name?: string
  report_id?: number | null
}

async function mp(path: string, init?: RequestInit) {
  return fetch(`${MP_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${MP_TOKEN}`,
    },
  })
}

// ── POST – Inicia el reporte (no bloquea) ─────────────────────────────
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!MP_TOKEN) return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  yesterday.setUTCHours(23, 59, 59, 0)
  const beginDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  beginDate.setUTCHours(0, 0, 0, 0)

  const createRes = await mp('/v1/account/release_report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      begin_date: beginDate.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      end_date:   yesterday.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    }),
  })
  if (!createRes.ok) {
    const txt = await createRes.text()
    return NextResponse.json({ error: 'No se pudo crear el reporte', detalle: txt }, { status: 502 })
  }
  const task = await createRes.json() as ReportTask

  return NextResponse.json({
    ok: true,
    taskId: task.id,
    status: task.status,
  })
}

// ── GET – Consulta estado del task; si está listo, procesa y guarda ───
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!MP_TOKEN) return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })

  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) return NextResponse.json({ error: 'Falta taskId' }, { status: 400 })

  // 1) Consultar estado
  const r = await mp(`/v1/account/release_report/task/${taskId}`)
  if (!r.ok) {
    const txt = await r.text()
    return NextResponse.json({ error: 'No se pudo consultar el task', detalle: txt }, { status: 502 })
  }
  const t = await r.json() as ReportTask

  if (t.status === 'failed' || t.status === 'error') {
    return NextResponse.json({ ok: false, status: t.status, error: 'El reporte falló en MP' }, { status: 502 })
  }
  if (t.status !== 'processed' || !t.file_name) {
    // Aún en cola / procesando
    return NextResponse.json({ ok: true, status: t.status, ready: false })
  }

  // 2) Descargar CSV
  const csvRes = await mp(`/v1/account/release_report/${t.file_name}`)
  if (!csvRes.ok) return NextResponse.json({ error: 'No se pudo descargar el CSV' }, { status: 502 })
  const csv = await csvRes.text()

  // 3) Parsear
  // Formato CSV release_report MP (separador `;`):
  //   0:DATE  1:SOURCE_ID  2:DESCRIPTION  3:CREDIT  4:DEBIT  5:NET_DEBIT
  //   6:NET_CREDIT  7:TRANSACTION_NET  8:SETTLEMENT_NET  9-11:varios
  //   12:BALANCE
  //
  // Tipos de DESCRIPTION relevantes:
  //   - payment              → ingreso (cobro recibido)
  //   - asset_management     → interés MP abonado
  //   - withdraw / payout    → retiro a banco externo (SALIDA)
  //   - mercadopago_transfer → transferencia a otro usuario MP (SALIDA)
  //   - refund               → reembolso a un pagador (SALIDA)
  //
  // Identificamos SALIDAS por: DEBIT > 0 (col[4]).
  const lines = csv.split('\n').filter(l => l.trim().length > 0)
  let saldoReal = 0
  let saldoFecha: Date | null = null
  let interesAcumulado = 0
  let totalDepositado = 0
  let cantidadDepositos = 0

  type MovOut = {
    fecha: string
    sourceId: string
    descripcion: string  // tipo de evento (raw description)
    glosa: string        // descripción legible
    monto: number        // positivo, en CLP
    saldoDespues: number
  }
  const movimientosOut: MovOut[] = []
  let totalGastosMp = 0

  // Descripciones legibles (es-CL)
  const descGlosa: Record<string, string> = {
    withdraw:               'Retiro a cuenta bancaria',
    payout:                 'Retiro a cuenta bancaria',
    mercadopago_transfer:   'Transferencia a otro usuario MP',
    refund:                 'Reembolso a pagador',
    reserve_for_dispute:    'Retención por disputa',
    chargeback:             'Contracargo',
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';')
    if (cols.length < 13) continue
    const date    = cols[0]
    const sourceId = (cols[1] ?? '').trim()
    const desc    = (cols[2] ?? '').trim()
    const credit  = parseFloat(cols[3] || '0')
    const debit   = parseFloat(cols[4] || '0')
    const balance = parseFloat(cols[12] || '0')
    if (!date) continue

    if (desc === 'asset_management') interesAcumulado += credit
    if (desc === 'payment') { totalDepositado += credit; cantidadDepositos += 1 }

    if (debit > 0) {
      const monto = Math.abs(Math.round(debit))
      const glosa = descGlosa[desc] ?? desc.replace(/_/g, ' ')
      movimientosOut.push({
        fecha:        date,
        sourceId,
        descripcion:  desc,
        glosa,
        monto,
        saldoDespues: Math.round(balance),
      })
      totalGastosMp += monto
    }

    if (balance > 0) {
      saldoReal = balance
      saldoFecha = new Date(date)
    }
  }

  if (!saldoFecha) {
    return NextResponse.json({ error: 'CSV vacío o sin movimientos' }, { status: 502 })
  }

  // Ordenar SALIDAS por fecha desc (más reciente primero)
  movimientosOut.sort((a, b) => b.fecha.localeCompare(a.fecha))

  // 4) Guardar
  await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      saldoReal: Math.round(saldoReal),
      saldoRealFecha: saldoFecha,
      interesRealAcumulado: Math.round(interesAcumulado),
      ultimaSincronizacion: new Date(),
      movimientosOutJson: JSON.stringify(movimientosOut),
      totalGastosMp,
    },
    update: {
      saldoReal: Math.round(saldoReal),
      saldoRealFecha: saldoFecha,
      interesRealAcumulado: Math.round(interesAcumulado),
      ultimaSincronizacion: new Date(),
      movimientosOutJson: JSON.stringify(movimientosOut),
      totalGastosMp,
    },
  })

  return NextResponse.json({
    ok: true,
    status: 'processed',
    ready: true,
    saldoReal: Math.round(saldoReal),
    saldoRealFecha: saldoFecha.toISOString(),
    interesRealAcumulado: Math.round(interesAcumulado),
    totalDepositado: Math.round(totalDepositado),
    cantidadDepositos,
    totalGastosMp,
    cantidadGastos: movimientosOut.length,
    fileName: t.file_name,
  })
}
