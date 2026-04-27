/**
 * POST /api/mercadopago/webhook
 * Recibe notificaciones IPN/webhook de MercadoPago.
 * MP envía { id, type } — si type='payment', buscamos el pago y lo procesamos.
 *
 * ⚠️  Para producción: configurar una URL pública (ej. con ngrok en local).
 *     En el dashboard de MP: Tus integraciones → Notificaciones → Webhooks.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMpPayment } from '@/lib/mercadopago'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { id?: string | number; type?: string; data?: { id?: string } }

    // MP envía type='payment' o type='merchant_order'
    const paymentId = body.data?.id ?? body.id
    const type      = body.type

    if (type !== 'payment' || !paymentId) {
      // Ignorar otros tipos (subscriptions, etc.)
      return NextResponse.json({ received: true })
    }

    // Obtener detalles del pago desde MP
    const payment = await getMpPayment().get({ id: String(paymentId) })

    if (!payment || !payment.external_reference) {
      return NextResponse.json({ received: true })
    }

    const externalRef    = payment.external_reference
    const status         = payment.status         ?? 'unknown'
    const statusDetail   = payment.status_detail  ?? ''
    const mpPagoId       = String(payment.id)

    // Buscar transacción en nuestra BD por external_reference
    const transaccion = await prisma.mercadoPagoTransaccion.findFirst({
      where: { externalRef },
      include: { alumno: true, item: true },
    })

    if (!transaccion) {
      // La transacción no existe en nuestra BD (pago externo o desincronizado)
      return NextResponse.json({ received: true })
    }

    // Actualizar estado de la transacción
    const updateData: Record<string, unknown> = {
      paymentId:    mpPagoId,
      status,
      statusDetail,
      updatedAt:    new Date(),
    }

    // Si el pago fue aprobado y aún no tiene Pago registrado → crear Pago
    if (status === 'approved' && !transaccion.pagoId) {
      const nuevoPago = await prisma.pago.create({
        data: {
          alumnoId: transaccion.alumnoId,
          itemId:   transaccion.itemId,
          monto:    transaccion.monto,
          fecha:    new Date(),
          comprobante: `mp_${mpPagoId}`,
        },
      })
      updateData.pagoId = nuevoPago.id
    }

    await prisma.mercadoPagoTransaccion.update({
      where: { id: transaccion.id },
      data:  updateData,
    })

    return NextResponse.json({ received: true, status })
  } catch (err) {
    console.error('[MP Webhook Error]', err)
    // Siempre responder 200 para que MP no reintente indefinidamente
    return NextResponse.json({ received: true })
  }
}

// MP también envía GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'mercadopago-webhook' })
}
