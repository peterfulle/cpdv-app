import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { autoImportMpDeposits } from '@/lib/autoImportMp'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Auto-importar transferencias MP que no provienen del checkout flow.
  // Throttled a 1 corrida cada 30s dentro del helper. No bloqueamos si falla.
  await autoImportMpDeposits().catch(() => null)

  // ── Totals ─────────────────────────────────────────────────────────────
  const fondoConfig = await prisma.fondoConfig.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  })

  const [otrosIngresos, recPoleron, recCuotas, metaPolRes, gastos, alumnos, itemsCuotas] =
    await Promise.all([
      prisma.otroIngreso.aggregate({ _sum: { monto: true } }),
      prisma.pago.aggregate({
        where: { item: { tipo: 1 } },
        _sum: { monto: true },
      }),
      prisma.pago.aggregate({
        where: { item: { tipo: 2 } },
        _sum: { monto: true },
      }),
      // Meta poleron: sum of talla values for each student's elected size
      prisma.$queryRaw<{ meta: bigint }[]>`
        SELECT COALESCE(SUM(t.talla_valor), 0) as meta
        FROM eleccion_polerones e
        JOIN tallas_polerones t ON e.eleccion_talla_id = t.talla_id
      `,
      prisma.gasto.aggregate({ _sum: { monto: true } }),
      prisma.alumno.count(),
      prisma.itemPagar.aggregate({
        where: { tipo: 2 },
        _sum: { valor: true },
      }),
    ])

  const totalOtros = otrosIngresos._sum.monto ?? 0
  const totalRecPoleron = recPoleron._sum.monto ?? 0
  const totalRecCuotas = recCuotas._sum.monto ?? 0
  const totalGastosLegacy = gastos._sum.monto ?? 0

  // ── OPCIÓN 3 (autoritativa): saldo y gastos provienen de MP ───────
  // saldoCaja = saldo real MP (cacheado release_report) + interés extrapolado
  //             segundo a segundo desde la última sincronización.
  // totalGastos = SOLO transferencias salientes desde la cuenta MP a terceros
  //               (retiros + transferencias MP→tercero + reembolsos).
  // Si aún no hay sincronización, caemos al cálculo legacy con un flag para
  // que la UI invite a sincronizar.
  const tasaAnual = fondoConfig.tasaAnualPct / 100
  let saldoCaja = 0
  let interesPorSegundo = 0
  let saldoSource: 'mp_real' | 'legacy' = 'legacy'
  let saldoBaseFecha: string | null = null
  let interesEstimadoExtra = 0

  if (fondoConfig.saldoReal && fondoConfig.saldoRealFecha) {
    const segundos = (Date.now() - fondoConfig.saldoRealFecha.getTime()) / 1000
    interesPorSegundo    = (fondoConfig.saldoReal * tasaAnual) / (365 * 24 * 60 * 60)
    interesEstimadoExtra = interesPorSegundo * segundos
    saldoCaja            = Math.round(fondoConfig.saldoReal + interesEstimadoExtra)
    saldoSource          = 'mp_real'
    saldoBaseFecha       = fondoConfig.saldoRealFecha.toISOString()
  } else {
    // Fallback al cálculo legacy (posiblemente con doble conteo)
    const totalIngresosLegacy = totalOtros + totalRecPoleron + totalRecCuotas
    saldoCaja = totalIngresosLegacy - totalGastosLegacy
  }

  // Gastos = solo salidas reales desde MP (cacheadas), o legacy si no hay sync
  const totalGastos = fondoConfig.totalGastosMp ?? totalGastosLegacy
  const gastosSource: 'mp_real' | 'legacy' =
    fondoConfig.totalGastosMp != null ? 'mp_real' : 'legacy'

  // Total ingresos (informativo): pagos manuales + otros ingresos
  // ⚠️ ESTE NÚMERO SIGUE SIENDO LEGACY (con posible doble conteo) — se mantiene
  // por compatibilidad con gráficos. La fuente de verdad es saldoCaja.
  const totalIngresos = totalOtros + totalRecPoleron + totalRecCuotas
  const metaPoleron = Number(metaPolRes[0]?.meta ?? 0)
  const metaCuotas = (itemsCuotas._sum.valor ?? 0) * alumnos
  const percPoleron = metaPoleron > 0 ? Math.round((totalRecPoleron / metaPoleron) * 100) : 0
  const percCuotas = metaCuotas > 0 ? Math.round((totalRecCuotas / metaCuotas) * 100) : 0

  // ── Alumnos con deuda ────────────────────────────────────────────────
  const alumnosPagos = await prisma.$queryRaw<{ alumno_id: bigint; total_pagado: bigint }[]>`
    SELECT p.pago_alumno_id as alumno_id, COALESCE(SUM(p.pago_monto),0) as total_pagado
    FROM pagos p
    JOIN items_pagar i ON p.pago_item_id = i.item_id
    WHERE i.item_tipo = 2
    GROUP BY p.pago_alumno_id
  `
  const pagadoMap = new Map(alumnosPagos.map((a) => [Number(a.alumno_id), Number(a.total_pagado)]))
  const totalPorAlumno = (itemsCuotas._sum.valor ?? 0)
  const alumnosPendientesCuotas = Array.from({ length: alumnos }, (_, i) => i + 1).filter((id) => {
    const pagado = pagadoMap.get(id) ?? 0
    return pagado < totalPorAlumno
  }).length

  const alumnosConPoleron = await prisma.pago.groupBy({
    by: ['alumnoId'],
    where: { item: { tipo: 1 } },
    _sum: { monto: true },
  })
  const pagadosPoleronMap = new Map(alumnosConPoleron.map((a) => [a.alumnoId, a._sum.monto ?? 0]))

  const elecciones = await prisma.eleccionPoleron.findMany({ include: { talla: true } })
  const alumnosPendientesPoleron = elecciones.filter((e) => {
    const pagado = pagadosPoleronMap.get(e.alumnoId) ?? 0
    return pagado < e.talla.valor
  }).length

  // ── Recent payments ──────────────────────────────────────────────────
  const recentPayments = await prisma.pago.findMany({
    take: 8,
    orderBy: { fecha: 'desc' },
    include: {
      alumno: true,
      item: true,
    },
  })

  // ── Monthly breakdown (last 6 months) ───────────────────────────────
  // Postgres: usar to_char en lugar de strftime (SQLite-only).
  const monthlyData = await prisma.$queryRaw<
    { mes: string; ingresos_cuotas: bigint; ingresos_poleron: bigint }[]
  >`
    SELECT 
      to_char(pago_fecha, 'YYYY-MM') as mes,
      COALESCE(SUM(CASE WHEN i.item_tipo = 2 THEN p.pago_monto ELSE 0 END), 0) as ingresos_cuotas,
      COALESCE(SUM(CASE WHEN i.item_tipo = 1 THEN p.pago_monto ELSE 0 END), 0) as ingresos_poleron
    FROM pagos p
    JOIN items_pagar i ON p.pago_item_id = i.item_id
    GROUP BY to_char(pago_fecha, 'YYYY-MM')
    ORDER BY mes ASC
    LIMIT 12
  `

  return NextResponse.json({
    kpis: {
      saldoCaja,
      totalIngresos,
      totalGastos,
      recaudadoPoleron: totalRecPoleron,
      metaPoleron,
      percPoleron,
      recaudadoCuotas: totalRecCuotas,
      metaCuotas,
      percCuotas,
      totalAlumnos: alumnos,
      alumnosPendientesCuotas,
      alumnosPendientesPoleron,
      otrosIngresos: totalOtros,
      // Metadata para que la UI explique el origen del saldo y permita
      // ofrecer el botón "Sincronizar saldo MP" cuando aún no hay cache.
      saldoSource,
      saldoBaseFecha,
      interesPorSegundo,
      ultimaSincronizacionMp: fondoConfig.ultimaSincronizacion?.toISOString() ?? null,
      gastosSource,
      // Para transparencia: también exponemos el cálculo legacy
      saldoLegacy: totalIngresos - totalGastosLegacy,
      gastosLegacy: totalGastosLegacy,
    },
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      alumnoNombre: p.alumno.nombre,
      itemNombre: p.item.nombre,
      monto: p.monto,
      fecha: p.fecha,
    })),
    monthlyData: monthlyData.map((m) => ({
      mes: m.mes,
      cuotas: Number(m.ingresos_cuotas),
      poleron: Number(m.ingresos_poleron),
      total: Number(m.ingresos_cuotas) + Number(m.ingresos_poleron),
    })),
  })
}
