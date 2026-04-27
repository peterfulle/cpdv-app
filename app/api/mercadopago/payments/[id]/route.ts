/**
 * GET /api/mercadopago/payments/[id]
 * Consulta el estado de un pago directamente en la API de MercadoPago.
 * Parámetro: id = paymentId de MP (no el id interno nuestro).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getMpPayment } from '@/lib/mercadopago'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const paymentId = params.id
  if (!paymentId || !/^\d+$/.test(paymentId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const [payment, transaccion] = await Promise.all([
    getMpPayment().get({ id: paymentId }),
    prisma.mercadoPagoTransaccion.findFirst({
      where: { paymentId },
      include: { alumno: true, item: true, pago: true },
    }),
  ])

  if (!payment) {
    return NextResponse.json({ error: 'Pago no encontrado en MP' }, { status: 404 })
  }

  return NextResponse.json({
    mp: {
      id:           payment.id,
      status:       payment.status,
      statusDetail: payment.status_detail,
      monto:        payment.transaction_amount,
      fecha:        payment.date_approved ?? payment.date_created,
      payer: {
        nombre: payment.payer?.first_name ?? '',
        email:  payment.payer?.email ?? '',
      },
      metodoPago:   payment.payment_method_id,
      cuotas:       payment.installments,
      externalRef:  payment.external_reference,
    },
    local: transaccion,
  })
}
