import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TEAL = '#22b2b2'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [ingresos, gastos, pagos, alumnos, items, elecciones] = await Promise.all([
    prisma.otroIngreso.findMany({ orderBy: { fecha: 'desc' } }),
    prisma.gasto.findMany({ orderBy: { fecha: 'desc' } }),
    prisma.pago.findMany({
      include: { alumno: true, item: true },
      orderBy: { fecha: 'desc' },
    }),
    prisma.alumno.findMany({ include: { pagos: { include: { item: true } } } }),
    prisma.itemPagar.findMany(),
    prisma.eleccionPoleron.findMany({ include: { talla: true } }),
  ])
  type MPTx = Awaited<ReturnType<typeof prisma.mercadoPagoTransaccion.findMany>>
  const mpTransacciones: MPTx = await prisma.mercadoPagoTransaccion.findMany().catch(() => [] as MPTx)
  const fondoConfig = await prisma.fondoConfig.findUnique({ where: { id: 1 } }).catch(() => null)

  const tallaMap = new Map(elecciones.map((e) => [e.alumnoId, e.talla]))

  // ── Daily payment trend ─────────────────────────────────────────────
  const pagosPorDia = new Map<string, number>()
  for (const p of pagos) {
    const key = p.fecha.toISOString().split('T')[0]
    pagosPorDia.set(key, (pagosPorDia.get(key) ?? 0) + p.monto)
  }
  const paymentTrend = Array.from(pagosPorDia.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, monto]) => ({ fecha, monto }))

  // ── Monthly trend (12 months) ──────────────────────────────────────
  const monthMap = new Map<string, { ingresos: number; cuotas: number; poleron: number; gastos: number; otros: number }>()
  const bucket = (d: Date) => {
    const k = d.toISOString().slice(0, 7)
    if (!monthMap.has(k)) monthMap.set(k, { ingresos: 0, cuotas: 0, poleron: 0, gastos: 0, otros: 0 })
    return monthMap.get(k)!
  }
  for (const p of pagos) {
    const b = bucket(p.fecha)
    b.ingresos += p.monto
    if (p.item.tipo === 1) b.poleron += p.monto
    if (p.item.tipo === 2) b.cuotas  += p.monto
  }
  for (const i of ingresos) {
    const b = bucket(i.fecha)
    b.ingresos += i.monto
    b.otros    += i.monto
  }
  for (const g of gastos) bucket(g.fecha).gastos += g.monto
  const monthlyTrend = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([mes, v]) => ({
      mes,
      cuotas: v.cuotas,
      poleron: v.poleron,
      otros: v.otros,
      ingresos: v.ingresos,
      gastos: v.gastos,
      neto: v.ingresos - v.gastos,
    }))

  // ── Top paying students ────────────────────────────────────────────
  const pagoPorAlumno = new Map<number, { nombre: string; total: number; cantidad: number }>()
  for (const p of pagos) {
    const prev = pagoPorAlumno.get(p.alumnoId) ?? { nombre: p.alumno.nombre, total: 0, cantidad: 0 }
    pagoPorAlumno.set(p.alumnoId, {
      nombre: prev.nombre,
      total: prev.total + p.monto,
      cantidad: prev.cantidad + 1,
    })
  }
  const topAlumnos = Array.from(pagoPorAlumno.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ── Cuota coverage ─────────────────────────────────────────────────
  const itemsCuotas = items.filter((i) => i.tipo === 2)
  const cuotaStats = itemsCuotas.map((item) => {
    const pagosItem = pagos.filter((p) => p.itemId === item.id)
    const totalPagado = pagosItem.reduce((sum, p) => sum + p.monto, 0)
    const alumnosPagaron = new Set(pagosItem.map((p) => p.alumnoId)).size
    return {
      nombre: item.nombre,
      valor: item.valor,
      totalPagado,
      alumnosPagaron,
      totalAlumnos: alumnos.length,
      porcentaje: alumnos.length > 0 ? Math.round((alumnosPagaron / alumnos.length) * 100) : 0,
    }
  })

  // ── Students debt ──────────────────────────────────────────────────
  const alumnosDebt = alumnos.map((a) => {
    const talla = tallaMap.get(a.id)
    let deuda = 0
    let pagado = 0
    for (const item of items) {
      const valorItem = item.tipo === 1 ? (talla?.valor ?? item.valor) : item.valor
      deuda += valorItem
    }
    for (const p of a.pagos) pagado += p.monto
    return {
      id: a.id,
      nombre: a.nombre,
      pagado,
      deuda,
      pendiente: Math.max(0, deuda - pagado),
      porcentaje: deuda > 0 ? Math.round((pagado / deuda) * 100) : 0,
    }
  }).sort((a, b) => b.pendiente - a.pendiente)

  // ── Income breakdown ───────────────────────────────────────────────
  const recPoleron = pagos.filter((p) => p.item.tipo === 1).reduce((s, p) => s + p.monto, 0)
  const recCuotas  = pagos.filter((p) => p.item.tipo === 2).reduce((s, p) => s + p.monto, 0)
  const totalOtros = ingresos.reduce((s, i) => s + i.monto, 0)
  const incomeBreakdown = [
    { name: 'Cuotas',    value: recCuotas,  color: TEAL },
    { name: 'Polerones', value: recPoleron, color: '#94a3b8' },
    { name: 'Otros',     value: totalOtros, color: '#cbd5e1' },
  ]

  // ── Payment method (MP vs efectivo) ────────────────────────────────
  const pagoIdsMP = new Set(
    mpTransacciones
      .filter(t => t.pagoId !== null)
      .map(t => t.pagoId as number)
  )
  let mpCount = 0, mpAmount = 0, efectivoCount = 0, efectivoAmount = 0
  for (const p of pagos) {
    if (pagoIdsMP.has(p.id)) { mpCount++;       mpAmount       += p.monto }
    else                     { efectivoCount++; efectivoAmount += p.monto }
  }
  const paymentMethods = [
    { name: 'MercadoPago', count: mpCount,       amount: mpAmount,       color: '#00b1ea' },
    { name: 'Efectivo',    count: efectivoCount, amount: efectivoAmount, color: '#10b981' },
  ]

  // ── Polerón por talla ──────────────────────────────────────────────
  const tallaCount = new Map<string, { nombre: string; cantidad: number; valor: number; recaudado: number; meta: number }>()
  for (const e of elecciones) {
    const k = e.talla.nombre
    if (!tallaCount.has(k)) tallaCount.set(k, { nombre: k, cantidad: 0, valor: e.talla.valor, recaudado: 0, meta: 0 })
    const t = tallaCount.get(k)!
    t.cantidad += 1
    t.meta     += e.talla.valor
  }
  for (const p of pagos.filter(p => p.item.tipo === 1)) {
    const talla = tallaMap.get(p.alumnoId)
    if (!talla) continue
    const t = tallaCount.get(talla.nombre)
    if (t) t.recaudado += p.monto
  }
  const polerSizes = Array.from(tallaCount.values()).sort((a, b) => a.valor - b.valor)

  // ── Day-of-week patterns ───────────────────────────────────────────
  const DOW = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const dowMap = new Map<number, { dia: string; monto: number; cantidad: number }>()
  DOW.forEach((d, i) => dowMap.set(i, { dia: d, monto: 0, cantidad: 0 }))
  for (const p of pagos) {
    const d = p.fecha.getDay()
    const r = dowMap.get(d)!
    r.monto    += p.monto
    r.cantidad += 1
  }
  const paymentsByDow = Array.from(dowMap.values())

  // ── Concentración / KPIs avanzados ─────────────────────────────────
  const totalIngresos = recPoleron + recCuotas + totalOtros
  const totalGastos   = gastos.reduce((s, g) => s + g.monto, 0)
  const top5Total = topAlumnos.slice(0, 5).reduce((s, a) => s + a.total, 0)
  const concentracion = totalIngresos > 0 ? Math.round((top5Total / totalIngresos) * 100) : 0

  const alumnosConPago = pagoPorAlumno.size
  const conversion = alumnos.length > 0 ? Math.round((alumnosConPago / alumnos.length) * 100) : 0
  const morosidad  = alumnos.length > 0
    ? Math.round((alumnosDebt.filter(a => a.pendiente > 0).length / alumnos.length) * 100)
    : 0

  const ticketPromedio = pagos.length > 0 ? Math.round(pagos.reduce((s, p) => s + p.monto, 0) / pagos.length) : 0
  const pagosPorAlumnoAvg = alumnosConPago > 0 ? +(pagos.length / alumnosConPago).toFixed(1) : 0

  // ── Gastos top-8 (por nombre) ─────────────────────────────────────
  const gastosPorNombre = new Map<string, number>()
  for (const g of gastos) gastosPorNombre.set(g.nombre, (gastosPorNombre.get(g.nombre) ?? 0) + g.monto)
  const topGastos = Array.from(gastosPorNombre.entries())
    .map(([nombre, monto]) => ({ nombre, monto }))
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 8)

  // ── MP fondo summary ──────────────────────────────────────────────
  let mpFondo: {
    saldoReal: number
    saldoActual: number
    interesAbonado: number
    interesExtrapolado: number
    tasaAnualPct: number
    ultimaSincronizacion: string | null
  } | null = null
  if (fondoConfig?.saldoReal && fondoConfig.saldoRealFecha) {
    const tasaAnual = fondoConfig.tasaAnualPct / 100
    const seg = (Date.now() - fondoConfig.saldoRealFecha.getTime()) / 1000
    const interesEx = (fondoConfig.saldoReal * tasaAnual) / (365 * 24 * 60 * 60) * seg
    mpFondo = {
      saldoReal: fondoConfig.saldoReal,
      saldoActual: Math.round(fondoConfig.saldoReal + interesEx),
      interesAbonado: fondoConfig.interesRealAcumulado ?? 0,
      interesExtrapolado: Math.round(interesEx),
      tasaAnualPct: fondoConfig.tasaAnualPct,
      ultimaSincronizacion: fondoConfig.ultimaSincronizacion?.toISOString() ?? null,
    }
  }

  return NextResponse.json({
    kpisAvanzados: {
      ticketPromedio,
      pagosPorAlumnoAvg,
      cantidadPagos: pagos.length,
      alumnosConPago,
      totalAlumnos: alumnos.length,
      conversionPct: conversion,
      morosidadPct: morosidad,
      concentracionTop5Pct: concentracion,
      top5Total,
    },
    paymentTrend,
    monthlyTrend,
    topAlumnos,
    cuotaStats,
    alumnosDebt,
    incomeBreakdown,
    paymentMethods,
    polerSizes,
    paymentsByDow,
    topGastos,
    mpFondo,
    resumenFinanciero: {
      totalIngresos,
      totalGastos,
      gastosPorCategoria: gastos.map((g) => ({ nombre: g.nombre, monto: g.monto })),
    },
  })
}
