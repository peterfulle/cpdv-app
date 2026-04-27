/**
 * Helper compartido para parsear y enriquecer payments de MercadoPago.
 * El endpoint /v1/payments/search ya devuelve el objeto completo;
 * de aquí extraemos: pagador, concepto, banco, identificación, etc.
 */

// ── Mapeo de issuer_id → nombre del banco ───────────────────────────
// MP no expone el nombre legible del banco emisor en /v1/payments,
// solo un código numérico (`payment_method.issuer_id`). Este mapping
// se construye empíricamente a partir de pagos conocidos.
// Si un pago llega con un issuer_id desconocido, se muestra "Banco #<id>".
export const ISSUER_ID_TO_BANK: Record<string, string> = {
  '12546': 'Banco Falabella',
  // Añade más a medida que los identifiques:
  // '12345': 'Banco Estado',
  // '12347': 'Banco de Chile',
}

export interface MpPaymentRaw {
  id: number
  status: string
  status_detail?: string | null
  transaction_amount: number
  date_approved?: string | null
  date_created: string
  description?: string | null
  payment_type_id?: string | null
  payment_method_id?: string | null
  operation_type?: string | null
  issuer_id?: string | number | null
  payment_method?: {
    id?: string | null
    issuer_id?: string | number | null
    type?: string | null
  } | null
  payer?: {
    id?: string | number | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    identification?: { type?: string | null; number?: string | null } | null
  } | null
  additional_info?: {
    payer?: {
      first_name?: string | null
      last_name?: string | null
    } | null
  } | null
  transaction_details?: {
    bank_transfer_id?: string | number | null
    transaction_id?: string | null
    financial_institution?: string | null
  } | null
  metadata?: Record<string, unknown> | null
}

export interface MpPaymentEnriched {
  id: number
  fecha: string
  monto: number
  estado: string
  descripcion: string       // concepto / asunto que el banco envió
  pagador: {
    nombre: string | null   // nombre completo del titular (raramente disponible en TEF)
    email: string | null
    identificacion: string | null  // ej: "RUT 12.345.678-9"
  }
  metodo: string | null              // payment_type_id (bank_transfer, account_money, …)
  tipoOperacion: string | null       // operation_type (account_fund, regular_payment…)
  issuerId: string | null            // código del banco emisor en MP
  bancoOrigen: string | null         // nombre legible si está mapeado
  bankTransferId: string | null      // id de la transferencia bancaria
  transactionId: string | null       // referencia TEF real (CCA…)
  esTransferenciaBancaria: boolean
}

const cleanStr = (s?: string | number | null): string | null => {
  if (s === null || s === undefined) return null
  const v = String(s).trim()
  return v.length === 0 ? null : v
}

export function buildPayerName(p: MpPaymentRaw): string | null {
  const f1 = cleanStr(p.payer?.first_name)
  const l1 = cleanStr(p.payer?.last_name)
  if (f1 || l1) return [f1, l1].filter(Boolean).join(' ')

  const f2 = cleanStr(p.additional_info?.payer?.first_name)
  const l2 = cleanStr(p.additional_info?.payer?.last_name)
  if (f2 || l2) return [f2, l2].filter(Boolean).join(' ')

  return null  // OJO: no usamos email como fallback porque suele ser el del receptor
}

export function buildIdentificacion(p: MpPaymentRaw): string | null {
  const id = p.payer?.identification
  if (!id) return null
  const tipo = cleanStr(id.type)
  const num  = cleanStr(id.number)
  if (!tipo && !num) return null
  return [tipo, num].filter(Boolean).join(' ')
}

export function resolveBankName(issuerId: string | null): string | null {
  if (!issuerId) return null
  return ISSUER_ID_TO_BANK[issuerId] ?? `Banco #${issuerId}`
}

export function enrichMpPayment(p: MpPaymentRaw): MpPaymentEnriched {
  const issuerRaw = p.payment_method?.issuer_id ?? p.issuer_id ?? null
  const issuerId  = cleanStr(issuerRaw)
  const metodo    = cleanStr(p.payment_type_id ?? p.payment_method_id)
  const esTEF     = metodo === 'bank_transfer' || (p.payment_method?.type === 'bank_transfer')

  return {
    id: p.id,
    fecha: p.date_approved ?? p.date_created,
    monto: p.transaction_amount,
    estado: p.status,
    descripcion: cleanStr(p.description) ?? '',
    pagador: {
      nombre: buildPayerName(p),
      email:  cleanStr(p.payer?.email),
      identificacion: buildIdentificacion(p),
    },
    metodo,
    tipoOperacion: cleanStr(p.operation_type),
    issuerId,
    bancoOrigen: esTEF ? resolveBankName(issuerId) : null,
    bankTransferId: cleanStr(p.transaction_details?.bank_transfer_id),
    transactionId:  cleanStr(p.transaction_details?.transaction_id),
    esTransferenciaBancaria: esTEF,
  }
}

/**
 * Construye un nombre legible para crear un OtroIngreso a partir del pago.
 * Combina pagador + concepto cuando existen.
 * Para TEF sin nombre, usa "TEF <Banco>" + concepto.
 */
export function buildOtroIngresoNombre(p: MpPaymentRaw): string {
  const e = enrichMpPayment(p)
  const partes: string[] = []

  if (e.pagador.nombre) {
    partes.push(e.pagador.nombre)
  } else if (e.esTransferenciaBancaria) {
    partes.push(e.bancoOrigen ? `TEF ${e.bancoOrigen}` : 'TEF entrante')
  }

  if (e.descripcion) partes.push(e.descripcion)
  if (partes.length === 0) return 'Transferencia MercadoPago'
  return partes.join(' · ')
}

