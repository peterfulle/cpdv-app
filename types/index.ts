export interface DashboardKPIs {
  saldoCaja: number
  totalIngresos: number
  totalGastos: number
  recaudadoPoleron: number
  metaPoleron: number
  percPoleron: number
  recaudadoCuotas: number
  metaCuotas: number
  percCuotas: number
  totalAlumnos: number
  alumnosPendientesCuotas: number
  alumnosPendientesPoleron: number
  otrosIngresos: number
}

export interface AlumnoConPagos {
  id: number
  nombre: string
  apoderados: string[]
  tallaPoleron: { nombre: string; valor: number } | null
  pagos: PagoItem[]
  totalPagado: number
  totalDeuda: number
  estadoGeneral: 'paid' | 'partial' | 'pending'
}

export interface PagoItem {
  id: number
  alumnoId: number
  itemId: number
  itemNombre: string
  itemValor: number
  monto: number
  comprobante: string | null
  fecha: string
  tipo: number
}

export interface GastoItem {
  id: number
  nombre: string
  monto: number
  fecha: string
  comprobante: string | null
}

export interface OtroIngresoItem {
  id: number
  nombre: string
  monto: number
  fecha: string
  comprobante: string
}

export interface ItemPagarInfo {
  id: number
  nombre: string
  valor: number
  tipo: number
  categoriaNombre: string
}

export interface MonthlyData {
  mes: string
  ingresos: number
  gastos: number
  saldo: number
}

export interface PaymentTrendItem {
  fecha: string
  monto: number
  alumno: string
  item: string
}
