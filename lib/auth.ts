import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const ipHeader = req.headers?.['x-forwarded-for'] as string | undefined
        const ip = ipHeader?.split(',')[0]?.trim() ?? 'unknown'

        const user = await prisma.usuario.findUnique({
          where: { nombre: credentials.username },
        })

        if (!user || user.estado !== 'activo') {
          await prisma.registroAcceso.create({
            data: {
              usuarioIntentado: credentials.username,
              ipDireccion: ip,
              resultado: user ? 'fallido_pass' : 'usuario_no_existe',
            },
          })
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.contrasena)

        await prisma.registroAcceso.create({
          data: {
            usuarioIntentado: credentials.username,
            ipDireccion: ip,
            resultado: isValid ? 'exitoso' : 'fallido_pass',
          },
        })

        if (!isValid) return null

        return {
          id: String(user.id),
          name: user.nombre,
          email: null,
          // Custom fields
          nivel: user.nivel,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.nivel = (user as any).nivel
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).nivel = token.nivel
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
