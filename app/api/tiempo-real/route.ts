import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cuota items in chronological order (id → month name)
const CUOTA_ITEMS: { id: number; nombre: string; mes: number }[] = [
  { id: 22, nombre: 'Marzo',      mes: 3  },
  { id: 23, nombre: 'Abril',      mes: 4  },
  { id: 24, nombre: 'Mayo',       mes: 5  },
  { id: 25, nombre: 'Junio',      mes: 6  },
  { id: 26, nombre: 'Julio',      mes: 7  },
  { id: 27, nombre: 'Agosto',     mes: 8  },
  { id: 28, nombre: 'Septiembre', mes: 9  },
  { id: 29, nombre: 'Octubre',    mes: 10 },
  { id: 30, nombre: 'Noviembre',  mes: 11 },
  { id: 31, nombre: 'Diciembre',  mes: 12 },
]
const CUOTA_VALOR = 10000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hoy  = new Date()
  const mes  = hoy.getMonth() + 1  // 1-based
  const anio = hoy.getFullYear()

  // Cuotas que ya debieron pagarse hasta este mes (inclusive)
  const cuotasDebidas = CUOTA_ITEMS.filter(c => c.mes <= mes)
  const cuotasPendientes = CUOTA_ITEMS.filter(c => c.mes > mes)
  const idsDebidos = cuotasDebidas.map(c => c.id)

  // ── Load all data in parallel ──────────────────────────────────────
  const [alumnos, elecciones, todosLosPagos] = await Promise.all([
    prisma.alumno.findMany({ orderBy: { nombre: 'asc' } }),
    prisma.eleccionPoleron.findMany({ include: { talla: true } }),
    prisma.pago.findMany({
      include: { item: true },
    }),
  ])

  const tallaMap = new Map(elecciones.map(e => [e.alumnoId, e.talla]))

  // ── Per-student breakdown ─────────────────────────────────────────
  const alumnoData = alumnos.map(alumno => {
    const pagoAlumno = todosLosPagos.filter(p => p.alumnoId === alumno.id)

    // Cuotas
    const pagosCuotas  = pagoAlumno.filter(p => p.item.tipo === 2)
    const itemsPagedSet = new Set(pagosCuotas.map(p => p.itemId))
    const montoCuotasPagado = pagosCuotas.reduce((s, p) => s + p.monto, 0)

    const cuotasPagadasInfo  = CUOTA_ITEMS.filter(c => itemsPagedSet.has(c.id))
    const cuotasAtrasadasInfo = cuotasDebidas.filter(c => !itemsPagedSet.has(c.id))
    const cuotasFaltantesInfo = cuotasPendientes.filter(c => !itemsPagedSet.has(c.id))

    const montoCuotasEsperadas = cuotasDebidas.length * CUOTA_VALOR  // what should be paid so far
    const montoCuotasMeta      = CUOTA_ITEMS.length * CUOTA_VALOR    // full year goal

    // Polerón
    const pagosPoleron  = pagoAlumno.filter(p => p.item.tipo === 1)
    const montoPoleroPagado = pagosPoleron.reduce((s, p) => s + p.monto, 0)
    const talla = tallaMap.get(alumno.id)
    const montoPoleroMeta = talla?.valor ?? 0
    const poleronAlDia = montoPoleroPagado >= montoPoleroMeta

    // Status cuotas
    const cuotasAtrasadas = cuotasAtrasadasInfo.length
    let statusCuotas: 'al_dia' | 'atrasado' | 'adelantado'
    if (cuotasAtrasadas === 0 && montoCuotasPagado >= montoCuotasEsperadas) {
      statusCuotas = montoCuotasPagado > montoCuotasEsperadas ? 'adelantado' : 'al_dia'
    } else {
      statusCuotas = 'atrasado'
    }

    // Has paid ahead (cuotas de meses futuros)
    const cuotasAdelantadas = CUOTA_ITEMS.filter(
      c => c.mes > mes && itemsPagedSet.has(c.id)
    )

    return {
      id:                   alumno.id,
      nombre:               alumno.nombre,
      talla:                talla?.nombre ?? '—',
      // Cuotas
      montoCuotasPagado,
      montoCuotasEsperadas,
      montoCuotasMeta,
      cuotasPagadas:        cuotasPagadasInfo.map(c => c.nombre),
      cuotasAtrasadas:      cuotasAtrasadasInfo.map(c => c.nombre),
      cuotasFaltantes:      cuotasFaltantesInfo.map(c => c.nombre),
      cuotasAdelantadas:    cuotasAdelantadas.map(c => c.nombre),
      statusCuotas,
      // Poleron
      montoPoleroPagado,
      montoPoleroMeta,
      poleronAlDia,
      // Combined score (0–100 vs lo esperado)
      porcCuotasVsMeta:       montoCuotasMeta > 0 ? Math.round((montoCuotasPagado / montoCuotasMeta) * 100) : 0,
      porcCuotasVsEsperado:   montoCuotasEsperadas > 0 ? Math.round((montoCuotasPagado / montoCuotasEsperadas) * 100) : 100,
      porcPoleron:            montoPoleroMeta > 0 ? Math.round((montoPoleroPagado / montoPoleroMeta) * 100) : 0,
    }
  })

  // ── Global KPIs ───────────────────────────────────────────────────
  const totalAlumnos      = alumnos.length
  const alDia             = alumnoData.filter(a => a.statusCuotas === 'al_dia').length
  const adelantados       = alumnoData.filter(a => a.statusCuotas === 'adelantado').length
  const atrasados         = alumnoData.filter(a => a.statusCuotas === 'atrasado').length
  const poleronCompleto   = alumnoData.filter(a => a.poleronAlDia).length

  const totalRecCuotas     = alumnoData.reduce((s, a) => s + a.montoCuotasPagado, 0)
  const totalEsperadoCuotas = cuotasDebidas.length * CUOTA_VALOR * totalAlumnos
  const totalMetaCuotas    = CUOTA_ITEMS.length * CUOTA_VALOR * totalAlumnos

  const totalRecPoleron    = alumnoData.reduce((s, a) => s + a.montoPoleroPagado, 0)
  const totalMetaPoleron   = alumnoData.reduce((s, a) => s + a.montoPoleroMeta, 0)

  const porcGlobalCuotasVsEsperado = totalEsperadoCuotas > 0
    ? Math.round((totalRecCuotas / totalEsperadoCuotas) * 100) : 100
  const porcGlobalCuotasVsMeta = totalMetaCuotas > 0
    ? Math.round((totalRecCuotas / totalMetaCuotas) * 100) : 0
  const porcGlobalPoleron = totalMetaPoleron > 0
    ? Math.round((totalRecPoleron / totalMetaPoleron) * 100) : 0

  // Projected year-end if current rate continues
  const mesesTranscurridos = cuotasDebidas.length   // months elapsed
  const mesesRestantes     = cuotasPendientes.length
  const tasaRecaudacion    = mesesTranscurridos > 0
    ? totalRecCuotas / mesesTranscurridos : 0
  const proyeccionAnual    = totalRecCuotas + (tasaRecaudacion * mesesRestantes)

  return NextResponse.json({
    generadoEn: hoy.toISOString(),
    mesActual: mes,
    anioActual: anio,
    cuotasDebidasHastahoy: cuotasDebidas.map(c => c.nombre),
    cuotasPendientes: cuotasPendientes.map(c => c.nombre),
    global: {
      totalAlumnos,
      alDia,
      adelantados,
      atrasados,
      poleronCompleto,
      porcGlobalCuotasVsEsperado,
      porcGlobalCuotasVsMeta,
      porcGlobalPoleron,
      totalRecCuotas,
      totalEsperadoCuotas,
      totalMetaCuotas,
      totalRecPoleron,
      totalMetaPoleron,
      proyeccionAnual,
      deficit: totalEsperadoCuotas - totalRecCuotas,
    },
    alumnos: alumnoData,
  })
}
