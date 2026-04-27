import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── Conciliación: reúne las 4 fuentes de verdad y explica la diferencia ──
//
//   A. Saldo bancario real MP (release_report cacheado en FondoConfig)
//   B. Ingresos contables del curso  = pagos + otros ingresos (DB local)
//   C. Gastos contables del curso    = gastos (DB local)
//   D. Neto contable curso           = B − C
//
//   Diferencia = A − D
//
// La diferencia NO es un error: refleja movimientos que no están en ambas
// contabilidades a la vez (intereses MP, retiros bancarios, depósitos no
// asentados como pagos locales, etc.).
//
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [config, pagosAgg, otrosAgg, gastosAgg, pagosCount, otrosCount, gastosCount] =
    await Promise.all([
      prisma.fondoConfig.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
      prisma.pago.aggregate({ _sum: { monto: true } }),
      prisma.otroIngreso.aggregate({ _sum: { monto: true } }),
      prisma.gasto.aggregate({ _sum: { monto: true } }),
      prisma.pago.count(),
      prisma.otroIngreso.count(),
      prisma.gasto.count(),
    ])

  const totalPagos  = pagosAgg._sum.monto ?? 0
  const totalOtros  = otrosAgg._sum.monto ?? 0
  const totalGastos = gastosAgg._sum.monto ?? 0
  // Ingresos del curso = SOLO OtroIngreso (entradas al banco). Los Pago son
  // asignaciones a alumnos/cuotas, no ingresos adicionales (sumarlos
  // producía doble conteo). totalPagos se mantiene como dato informativo.
  const ingresosCurso = totalOtros
  const netoCurso     = ingresosCurso - totalGastos

  // Saldo bancario MP (preferencia: saldoReal cacheado; si no existe, null)
  const tasaAnual = config.tasaAnualPct / 100
  let saldoBancarioMP: number | null = null
  let interesEstimadoExtra = 0
  let fechaSaldoMP: string | null = null
  let interesAbonadoMP: number | null = null

  if (config.saldoReal && config.saldoRealFecha) {
    const segundos = (Date.now() - config.saldoRealFecha.getTime()) / 1000
    interesEstimadoExtra = (config.saldoReal * tasaAnual) / (365 * 24 * 60 * 60) * segundos
    saldoBancarioMP      = Math.round(config.saldoReal + interesEstimadoExtra)
    fechaSaldoMP         = config.saldoRealFecha.toISOString()
    interesAbonadoMP     = config.interesRealAcumulado ?? 0
  }

  const diferencia = saldoBancarioMP !== null ? saldoBancarioMP - netoCurso : null

  return NextResponse.json({
    saldoBancarioMP: {
      valor: saldoBancarioMP,
      fechaSincronizacion: fechaSaldoMP,
      ultimaSincronizacion: config.ultimaSincronizacion?.toISOString() ?? null,
      interesAbonadoMP,
      interesExtrapolado: Math.round(interesEstimadoExtra),
      disponible: saldoBancarioMP !== null,
    },
    contabilidadCurso: {
      ingresosTotales: ingresosCurso,
      pagos: { total: totalPagos, cantidad: pagosCount },
      otrosIngresos: { total: totalOtros, cantidad: otrosCount },
      gastos: { total: totalGastos, cantidad: gastosCount },
      netoCurso,
    },
    conciliacion: {
      diferencia,
      // pistas legibles para el usuario
      explicacion: diferencia === null
        ? 'Sincroniza el saldo real de MP para ver la conciliación.'
        : diferencia > 0
          ? `Hay $${diferencia.toLocaleString('es-CL')} en MP que no figuran como neto del curso. Posibles causas: intereses ganados, depósitos en MP no registrados como pagos locales, o gastos del curso pagados con efectivo (no afectan la cuenta MP).`
          : diferencia < 0
            ? `El neto contable supera el saldo MP por $${Math.abs(diferencia).toLocaleString('es-CL')}. Posibles causas: retiros bancarios desde MP no registrados como gastos, o pagos locales que nunca llegaron a la cuenta MP.`
            : 'Saldo MP y neto contable coinciden exactamente.',
    },
    timestampCalculo: new Date().toISOString(),
  })
}
