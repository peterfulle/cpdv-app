/**
 * POST /api/mercadopago/preference
 * Crea una preferencia de pago en MP y guarda la transacción en BD.
 * Body: { alumnoId: number, itemId: number }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMpPreference, MP_WEBHOOK_BASE } from '@/lib/mercadopago'
import { z } from 'zod'

const bodySchema = z.object({
  alumnoId: z.number().int().positive(),
  itemId:   z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userNivel = (session.user as any)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  const externalRef = `cpv_${alumnoId}_${itemId}_${Date.now()}`

  // Omitir notification_url en localhost (MP no puede llegar a él)
  const isLocalhost = MP_WEBHOOK_BASE.includes('localhost') || MP_WEBHOOK_BASE.includes('127.0.0.1')

  let preference
  try {
    preference = await getMpPreference().create({
      body: {
        items: [
          {
            id:         String(item.id),
            title:      `${item.nombre} — ${alumno.nombre}`,
            quantity:   1,
            unit_price: item.valor,
            currency_id: 'CLP',
          },
        ],
        payer: { name: alumno.nombre },
        external_reference: externalRef,
        ...(isLocalhost ? {} : {
          notification_url: `${MP_WEBHOOK_BASE}/api/mercadopago/webhook`,
        }),
        back_urls: {
          success: `${MP_WEBHOOK_BASE}/dashboard/mercadopago?mp=success&ref=${externalRef}`,
          failure: `${MP_WEBHOOK_BASE}/dashboard/mercadopago?mp=failure&ref=${externalRef}`,
          pending: `${MP_WEBHOOK_BASE}/dashboard/mercadopago?mp=pending&ref=${externalRef}`,
        },
        ...(isLocalhost ? {} : { auto_return: 'approved' }),
        statement_descriptor: '2A CPDV Tesoreria',
      },
    })
  } catch (err: any) {
    const msg = err?.message ?? err?.cause?.message ?? 'Error al conectar con MercadoPago'
    console.error('[MP Preference Error]', err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!preference.id || !preference.init_point) {
    return NextResponse.json({ error: 'Error creando preferencia en MercadoPago' }, { status: 500 })
  }

  const transaccion = await prisma.mercadoPagoTransaccion.create({
    data: {
      preferenceId: preference.id,
      alumnoId,
      itemId,
      monto:       item.valor,
      externalRef,
      checkoutUrl: preference.init_point,
      status:      'pending',
    },
  })

  return NextResponse.json({
    transaccionId: transaccion.id,
    preferenceId:  preference.id,
    checkoutUrl:   preference.init_point,
    sandboxUrl:    preference.sandbox_init_point ?? null,
    externalRef,
    alumno:        alumno.nombre,
    item:          item.nombre,
    monto:         item.valor,
  })
}
