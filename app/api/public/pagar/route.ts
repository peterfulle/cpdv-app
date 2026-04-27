/**
 * POST /api/public/pagar
 * Crea un link de pago MercadoPago sin autenticación (para apoderados/alumnos).
 * Body: { alumnoId: number, itemId: number }
 * Returns: { checkoutUrl: string, sandboxUrl: string | null, preferenceId: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getMpPreference, MP_WEBHOOK_BASE } from '@/lib/mercadopago'
import { z } from 'zod'

const bodySchema = z.object({
  alumnoId: z.number().int().positive(),
  itemId:   z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 422 })
  }

  const { alumnoId, itemId } = parsed.data

  const [alumno, item] = await Promise.all([
    prisma.alumno.findUnique({ where: { id: alumnoId } }),
    prisma.itemPagar.findUnique({ where: { id: itemId } }),
  ])

  if (!alumno) return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  if (!item)   return NextResponse.json({ error: 'Item no encontrado' },   { status: 404 })

  // Verificar que el item no esté ya pagado
  const existingPago = await prisma.pago.findFirst({ where: { alumnoId, itemId } })
  if (existingPago) {
    return NextResponse.json({ error: 'Este item ya fue pagado' }, { status: 409 })
  }

  const externalRef  = `cpv_pub_${alumnoId}_${itemId}_${Date.now()}`
  const isLocalhost  = MP_WEBHOOK_BASE.includes('localhost') || MP_WEBHOOK_BASE.includes('127.0.0.1')

  let preference
  try {
    preference = await getMpPreference().create({
      body: {
        items: [
          {
            id:          String(item.id),
            title:       `${item.nombre} — ${alumno.nombre}`,
            quantity:    1,
            unit_price:  item.valor,
            currency_id: 'CLP',
          },
        ],
        payer:              { name: alumno.nombre },
        external_reference: externalRef,
        back_urls: {
          success: `${MP_WEBHOOK_BASE}/login?mp=ok&ref=${externalRef}`,
          failure: `${MP_WEBHOOK_BASE}/login?mp=error`,
          pending: `${MP_WEBHOOK_BASE}/login?mp=pending`,
        },
        ...(isLocalhost ? {} : {
          notification_url: `${MP_WEBHOOK_BASE}/api/mercadopago/webhook`,
          auto_return:      'approved',
        }),
        statement_descriptor: 'CPV PENALOLEN',
      },
    })
  } catch (err: any) {
    const msg = err?.message ?? 'Error al conectar con MercadoPago'
    console.error('[Public Pagar Error]', err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!preference.id || !preference.init_point) {
    return NextResponse.json({ error: 'No se pudo crear el link de pago' }, { status: 502 })
  }

  // Guardar transacción en BD
  await prisma.mercadoPagoTransaccion.create({
    data: {
      preferenceId: preference.id,
      alumnoId,
      itemId,
      monto:        item.valor,
      externalRef,
      checkoutUrl:  preference.init_point,
      status:       'pending',
    },
  })

  return NextResponse.json({
    checkoutUrl:  preference.init_point,
    sandboxUrl:   preference.sandbox_init_point ?? null,
    preferenceId: preference.id,
  })
}
