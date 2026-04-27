import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Diagnóstico: descompone B (neto contable) y detecta posibles duplicados
// entre Pago (manual) y OtroIngreso (auto-importado desde MP).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [pagos, otros, gastos] = await Promise.all([
    prisma.pago.findMany({
      select: { id: true, monto: true, fecha: true, comprobante: true, alumnoId: true },
      orderBy: { fecha: 'desc' },
    }),
    prisma.otroIngreso.findMany({
      select: { id: true, monto: true, fecha: true, comprobante: true, nombre: true },
      orderBy: { fecha: 'desc' },
    }),
    prisma.gasto.aggregate({ _sum: { monto: true }, _count: true }),
  ])

  const pagosMP = pagos.filter(p => p.comprobante?.startsWith('mp_'))
  const pagosManual = pagos.filter(p => !p.comprobante?.startsWith('mp_'))
  const otrosMP = otros.filter(o => o.comprobante?.startsWith('mp_'))
  const otrosManual = otros.filter(o => !o.comprobante?.startsWith('mp_'))

  const sum = (arr: { monto: number }[]) => arr.reduce((a, b) => a + b.monto, 0)

  // Detección de duplicados Pago↔OtroIngreso por mismo comprobante mp_*
  const pagoMpKeys = new Set(pagosMP.map(p => p.comprobante!))
  const dupComprobante = otrosMP.filter(o => pagoMpKeys.has(o.comprobante!))

  // Detección heurística: mismo monto + fecha (±2 días) entre pago manual y otro ingreso
  const dupHeuristico: Array<{ pagoId: number; otroId: number; monto: number; pagoFecha: string; otroFecha: string }> = []
  for (const p of pagosManual) {
    for (const o of otros) {
      if (p.monto !== o.monto) continue
      const diff = Math.abs(p.fecha.getTime() - o.fecha.getTime())
      if (diff <= 2 * 24 * 60 * 60 * 1000) {
        dupHeuristico.push({
          pagoId: p.id,
          otroId: o.id,
          monto: p.monto,
          pagoFecha: p.fecha.toISOString().slice(0, 10),
          otroFecha: o.fecha.toISOString().slice(0, 10),
        })
      }
    }
  }

  const totalPagos = sum(pagos)
  const totalOtros = sum(otros)
  const totalGastos = gastos._sum.monto ?? 0
  const ingresosCurso = totalPagos + totalOtros
  const netoCurso = ingresosCurso - totalGastos

  // Vista alternativa: solo cuenta lo que tiene comprobante mp_* (1 vez)
  const todosMpComprobantes = new Map<string, number>()
  for (const p of pagosMP) if (p.comprobante) todosMpComprobantes.set(p.comprobante, p.monto)
  for (const o of otrosMP) if (o.comprobante) todosMpComprobantes.set(o.comprobante, o.monto) // sobrescribe si dup
  const totalMpUnico = Array.from(todosMpComprobantes.values()).reduce((a, b) => a + b, 0)
  const totalManualSinMp = sum(pagosManual) + sum(otrosManual)

  return NextResponse.json({
    formula_actual_B: {
      ingresos: ingresosCurso,
      pagos: { total: totalPagos, count: pagos.length },
      otros_ingresos: { total: totalOtros, count: otros.length },
      gastos: { total: totalGastos, count: gastos._count },
      neto: netoCurso,
    },
    desglose: {
      pagos_con_mp_comprobante:    { total: sum(pagosMP),    count: pagosMP.length },
      pagos_manuales_sin_mp:       { total: sum(pagosManual), count: pagosManual.length },
      otros_con_mp_comprobante:    { total: sum(otrosMP),    count: otrosMP.length },
      otros_manuales_sin_mp:       { total: sum(otrosManual), count: otrosManual.length },
    },
    posibles_duplicados: {
      por_mismo_comprobante_mp: {
        cantidad: dupComprobante.length,
        monto_duplicado: sum(dupComprobante),
        items: dupComprobante.map(d => ({ otroId: d.id, comprobante: d.comprobante, monto: d.monto, nombre: d.nombre })),
      },
      heuristico_mismo_monto_y_fecha_cercana: {
        cantidad: dupHeuristico.length,
        monto_potencial_duplicado: dupHeuristico.reduce((a, b) => a + b.monto, 0),
        items: dupHeuristico.slice(0, 30),
      },
    },
    vista_alternativa_sin_doble_conteo: {
      mp_unico: totalMpUnico,
      manual_fuera_de_mp: totalManualSinMp,
      ingresos_corregidos: totalMpUnico + totalManualSinMp,
      neto_corregido: totalMpUnico + totalManualSinMp - totalGastos,
    },
  })
}
