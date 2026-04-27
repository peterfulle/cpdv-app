/**
 * Seed script: creates/resets the admin and viewer users with known passwords.
 * Run with: npm run seed
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const USERS = [
  { nombre: 'tesorero',  contrasena: 'tesorero123',  nivel: 'Administrador', estado: 'activo' },
  { nombre: 'apoderado', contrasena: 'apoderado123', nivel: 'Usuario',        estado: 'activo' },
]

async function main() {
  console.log('🌱 Seeding users...\n')

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.contrasena, 10)

    await prisma.usuario.upsert({
      where:  { nombre: u.nombre },
      update: { contrasena: hash, nivel: u.nivel, estado: u.estado },
      create: { nombre: u.nombre, contrasena: hash, nivel: u.nivel, estado: u.estado },
    })

    console.log(`  ✅  ${u.nombre.padEnd(12)} → password: ${u.contrasena}`)
  }

  console.log('\n✔ Done.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
