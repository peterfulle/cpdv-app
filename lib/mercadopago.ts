/**
 * MercadoPago client — solo server-side.
 * NUNCA importar en componentes cliente ni exponer el access token.
 */
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token) throw new Error('[MercadoPago] MP_ACCESS_TOKEN no está definido. Reinicia el servidor de desarrollo.')
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10000 } })
}

export function getMpPreference() { return new Preference(getClient()) }
export function getMpPayment()    { return new Payment(getClient()) }

/** Clave pública para el frontend (segura de exponer) */
export const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY ?? ''

/** Base URL para webhooks y back_urls */
export const MP_WEBHOOK_BASE = process.env.MP_WEBHOOK_BASE_URL ?? 'http://localhost:3000'
