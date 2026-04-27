/**
 * GET /api/mercadopago/account
 * Obtiene información de la cuenta MP conectada (usuario, negocio, país).
 * Solo accesible por Administrador.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MercadoPagoConfig, User } from 'mercadopago'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userNivel = (session.user as any)?.nivel
  if (userNivel !== 'Administrador') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'MP_ACCESS_TOKEN no configurado' }, { status: 500 })

  const client = new MercadoPagoConfig({ accessToken: token })
  const user   = new User(client)

  try {
    const me = await user.get()
    return NextResponse.json({
      id:       me.id,
      nickname: me.nickname,
      email:    me.email,
      pais:     me.site_id,
      estado:   me.status,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Error al obtener cuenta' }, { status: 502 })
  }
}
