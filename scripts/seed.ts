import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Idempotencia: si ya hay usuarios, omitir el seed completo.
  // Útil para que el deploy de Render no reescriba datos en cada release.
  const existingUsers = await prisma.usuario.count()
  if (existingUsers > 0 && process.env.SEED_FORCE !== '1') {
    console.log(`⏭️  Seed omitido: ya existen ${existingUsers} usuarios. Usa SEED_FORCE=1 para forzar.`)
    return
  }

  // Clean all tables in dependency order
  await prisma.pago.deleteMany()
  await prisma.gasto.deleteMany()
  await prisma.otroIngreso.deleteMany()
  await prisma.eleccionPoleron.deleteMany()
  await prisma.apoderado.deleteMany()
  await prisma.itemPagar.deleteMany()
  await prisma.categoriaItem.deleteMany()
  await prisma.tallaPoleron.deleteMany()
  await prisma.alumno.deleteMany()
  await prisma.registroAcceso.deleteMany()
  await prisma.usuario.deleteMany()

  // --- Usuarios ---
  const pw1 = await bcrypt.hash('tesorero2026', 10)
  const pw2 = await bcrypt.hash('apoderado2026', 10)
  await prisma.usuario.createMany({
    data: [
      { id: 1, nombre: 'tesorero',  contrasena: pw1, nivel: 'Administrador', estado: 'activo' },
      { id: 2, nombre: 'apoderado', contrasena: pw2, nivel: 'Usuario',        estado: 'activo' },
    ],
  })
  console.log('✅ Usuarios creados')

  // --- Tallas ---
  await prisma.tallaPoleron.createMany({
    data: [
      { id: 1, nombre: 'Talla 8',  valor: 25000 },
      { id: 2, nombre: 'Talla 10', valor: 27000 },
      { id: 3, nombre: 'Talla 12', valor: 27000 },
      { id: 4, nombre: 'Talla 14', valor: 27000 },
    ],
  })
  console.log('✅ Tallas creadas')

  // --- Alumnos ---
  await prisma.alumno.createMany({
    data: [
      { id:  1, nombre: 'Acevedo Muñoz, Nicolás Ignacio' },
      { id:  2, nombre: 'Alliende Suarez, Florencia Antonia' },
      { id:  3, nombre: 'Arteaga Lesser, Damián' },
      { id:  4, nombre: 'Barrientos Gutierrez, Juan Pablo' },
      { id:  5, nombre: 'Bascur Gesell, Martín Sebastián' },
      { id:  6, nombre: 'Cabrera Vásquez, Lucía' },
      { id:  7, nombre: 'Camacho Jorquera, Gabriel Salvador' },
      { id:  8, nombre: 'Cortéz Rodríguez, Nicolás Ignacio' },
      { id:  9, nombre: 'Díaz Catalán, Cristobal' },
      { id: 10, nombre: 'Etter Laborie, Ignacia' },
      { id: 11, nombre: 'Fulle Verdugo, Gaspar Ignacio' },
      { id: 12, nombre: 'Gallardo Moreno, Alonso Ignacio' },
      { id: 13, nombre: 'Gutiérrez Leal, Oscar Luciano' },
      { id: 14, nombre: 'Hazbún Muñoz, Santino Felipe' },
      { id: 15, nombre: 'Lagos Rodríguez, Emilia' },
      { id: 16, nombre: 'Lazzarich Becerra, Gaspar Emilio' },
      { id: 17, nombre: 'Luna Mazza, Benicio' },
      { id: 18, nombre: 'Majluf Lee, Skandar Khalid' },
      { id: 19, nombre: 'Mauricio Caamaño, Lucas Diego' },
      { id: 20, nombre: 'Muñoz González, Gustavo Ignacio' },
      { id: 21, nombre: 'Neira Espinoza, Isidora Florencia' },
      { id: 22, nombre: 'Pizarro Ruiz, Emma Paz' },
      { id: 23, nombre: 'San Juan Páez, Daniela Ignacia' },
      { id: 24, nombre: 'Soto González, Leonor Pascalle' },
      { id: 25, nombre: 'Troncoso Pérez, Agustina' },
      { id: 26, nombre: 'Valdés Aguayo, Camila Ignacia' },
      { id: 27, nombre: 'Vegas Cavieres, Mateo Oliver' },
      { id: 28, nombre: 'Zalaquett Núñez, Agustín Agip' },
    ],
  })
  console.log('✅ Alumnos creados')

  // --- Apoderados ---
  await prisma.apoderado.createMany({
    data: [
      { id:  1, alumnoId:  1, nombre: 'Gonzalo Acevedo' },
      { id:  2, alumnoId:  1, nombre: 'Katherine Muñoz' },
      { id:  3, alumnoId:  2, nombre: 'Juan José Alliende' },
      { id:  4, alumnoId:  2, nombre: 'Fernanda Suarez' },
      { id:  5, alumnoId:  3, nombre: 'Juan Arteaga' },
      { id:  6, alumnoId:  3, nombre: 'Melissa Lesser' },
      { id:  7, alumnoId:  4, nombre: 'Luis Manuel Barrientos' },
      { id:  8, alumnoId:  4, nombre: 'Eva Gutierrez' },
      { id:  9, alumnoId:  5, nombre: 'Enzo Bascur' },
      { id: 10, alumnoId:  5, nombre: 'Paulina Gesell' },
      { id: 11, alumnoId:  6, nombre: 'Giancarlo Cabrera' },
      { id: 12, alumnoId:  6, nombre: 'Claudia Vásquez' },
      { id: 13, alumnoId:  7, nombre: 'Eduardo Camacho' },
      { id: 14, alumnoId:  7, nombre: 'Javiera Jorquera' },
      { id: 15, alumnoId:  8, nombre: 'Ignacio Cortez' },
      { id: 16, alumnoId:  8, nombre: 'Makarena Rodríguez' },
      { id: 17, alumnoId:  9, nombre: 'Francisco Díaz' },
      { id: 18, alumnoId:  9, nombre: 'Inés Catalán' },
      { id: 19, alumnoId: 10, nombre: 'Rodrigo Etter' },
      { id: 20, alumnoId: 10, nombre: 'Leslie Laborie' },
      { id: 21, alumnoId: 11, nombre: 'N/A' },
      { id: 22, alumnoId: 11, nombre: 'Camila Verdugo' },
      { id: 23, alumnoId: 12, nombre: 'Alejandro Gallardo' },
      { id: 24, alumnoId: 12, nombre: 'Elizabeth Moreno' },
      { id: 25, alumnoId: 13, nombre: 'Oscar Gutiérrez' },
      { id: 26, alumnoId: 13, nombre: 'Evelin Leal' },
      { id: 27, alumnoId: 14, nombre: 'N/A' },
      { id: 28, alumnoId: 14, nombre: 'Karem Jaramillo' },
      { id: 29, alumnoId: 15, nombre: 'Nicolás Lagos' },
      { id: 30, alumnoId: 15, nombre: 'Paulina Zuñiga' },
      { id: 31, alumnoId: 16, nombre: 'Fernando Lazzarich' },
      { id: 32, alumnoId: 16, nombre: 'Marjorie Becerra' },
      { id: 33, alumnoId: 17, nombre: 'N/A' },
      { id: 34, alumnoId: 17, nombre: 'Magali Mazza' },
      { id: 35, alumnoId: 18, nombre: 'Cristobal Majluf' },
      { id: 36, alumnoId: 18, nombre: 'Nankyo Lee' },
      { id: 37, alumnoId: 19, nombre: 'Daniel Mauricio' },
      { id: 38, alumnoId: 19, nombre: 'Jocelin Caamaño' },
      { id: 39, alumnoId: 20, nombre: 'Sergio Muñoz' },
      { id: 40, alumnoId: 20, nombre: 'Andrea González' },
      { id: 41, alumnoId: 21, nombre: 'Diego Neira' },
      { id: 42, alumnoId: 21, nombre: 'Mariana Espinoza' },
      { id: 43, alumnoId: 22, nombre: 'Richard Pizarro' },
      { id: 44, alumnoId: 22, nombre: 'Katherine Ruiz' },
      { id: 45, alumnoId: 23, nombre: 'Axel San Juan' },
      { id: 46, alumnoId: 23, nombre: 'Paula Páez' },
      { id: 47, alumnoId: 24, nombre: 'Feipe Soto' },
      { id: 48, alumnoId: 24, nombre: 'Catherinne González' },
      { id: 49, alumnoId: 25, nombre: 'Felipe Troncoso' },
      { id: 50, alumnoId: 25, nombre: 'Daniela Pérez' },
      { id: 51, alumnoId: 26, nombre: 'Oscar Valdés' },
      { id: 52, alumnoId: 26, nombre: 'Verónica Aguayo' },
      { id: 53, alumnoId: 27, nombre: 'Paulo Vegas' },
      { id: 54, alumnoId: 27, nombre: 'Andrea Cavieres' },
      { id: 55, alumnoId: 28, nombre: 'Guillermo Zalaquett' },
      { id: 56, alumnoId: 28, nombre: 'Natalia Núñez' },
    ],
  })
  console.log('✅ Apoderados creados')

  // --- Categorías ---
  await prisma.categoriaItem.createMany({
    data: [
      { id: 1, nombre: 'Polerón' },
      { id: 2, nombre: 'Cuota' },
    ],
  })
  console.log('✅ Categorías creadas')

  // --- Items a pagar ---
  await prisma.itemPagar.createMany({
    data: [
      { id: 10, nombre: 'Polerón de Curso',  valor:     0, tipo: 1 },
      { id: 22, nombre: 'cuota marzo',       valor: 10000, tipo: 2 },
      { id: 23, nombre: 'cuota abril',       valor: 10000, tipo: 2 },
      { id: 24, nombre: 'cuota mayo',        valor: 10000, tipo: 2 },
      { id: 25, nombre: 'cuota junio',       valor: 10000, tipo: 2 },
      { id: 26, nombre: 'cuota julio',       valor: 10000, tipo: 2 },
      { id: 27, nombre: 'cuota agosto',      valor: 10000, tipo: 2 },
      { id: 28, nombre: 'cuota septiembre',  valor: 10000, tipo: 2 },
      { id: 29, nombre: 'cuota octubre',     valor: 10000, tipo: 2 },
      { id: 30, nombre: 'cuota noviembre',   valor: 10000, tipo: 2 },
      { id: 31, nombre: 'cuota diciembre',   valor: 10000, tipo: 2 },
    ],
  })
  console.log('✅ Items creados')

  // --- Elecciones de polerón ---
  await prisma.eleccionPoleron.createMany({
    data: [
      { id:  1, alumnoId:  1, tallaId: 3 },
      { id:  2, alumnoId:  2, tallaId: 1 },
      { id:  3, alumnoId:  3, tallaId: 3 },
      { id:  4, alumnoId:  4, tallaId: 1 },
      { id:  5, alumnoId:  5, tallaId: 4 },
      { id:  6, alumnoId:  6, tallaId: 3 },
      { id:  7, alumnoId:  7, tallaId: 3 },
      { id:  8, alumnoId:  8, tallaId: 3 },
      { id:  9, alumnoId:  9, tallaId: 4 },
      { id: 10, alumnoId: 10, tallaId: 3 },
      { id: 11, alumnoId: 11, tallaId: 1 },
      { id: 12, alumnoId: 12, tallaId: 2 },
      { id: 13, alumnoId: 13, tallaId: 2 },
      { id: 14, alumnoId: 14, tallaId: 1 },
      { id: 15, alumnoId: 15, tallaId: 2 },
      { id: 16, alumnoId: 16, tallaId: 3 },
      { id: 17, alumnoId: 17, tallaId: 2 },
      { id: 18, alumnoId: 18, tallaId: 2 },
      { id: 19, alumnoId: 19, tallaId: 2 },
      { id: 20, alumnoId: 20, tallaId: 2 },
      { id: 21, alumnoId: 21, tallaId: 2 },
      { id: 22, alumnoId: 22, tallaId: 2 },
      { id: 23, alumnoId: 23, tallaId: 2 },
      { id: 24, alumnoId: 24, tallaId: 3 },
      { id: 25, alumnoId: 25, tallaId: 1 },
      { id: 26, alumnoId: 26, tallaId: 3 },
      { id: 27, alumnoId: 27, tallaId: 3 },
      { id: 28, alumnoId: 28, tallaId: 1 },
    ],
  })
  console.log('✅ Elecciones de polerón creadas')

  // --- Gastos ---
  await prisma.gasto.createMany({
    data: [
      { id: 1, nombre: 'Huevos de chocolate',               monto:  23819, fecha: new Date('2026-04-05'), comprobante: 'gasto_1775419891.jpg' },
      { id: 2, nombre: 'Torta cuchufli',                    monto:  23000, fecha: new Date('2026-04-05'), comprobante: 'gasto_1775419924.jpg' },
      { id: 3, nombre: 'Abono polerones',                   monto:  25000, fecha: new Date('2026-04-05'), comprobante: 'gasto_1775419950.jpg' },
      { id: 4, nombre: 'Abono polerones',                   monto: 375000, fecha: new Date('2026-04-05'), comprobante: 'gasto_1775419991.jpg' },
      { id: 5, nombre: 'reserva parcela paseo fin de año',  monto: 320000, fecha: new Date('2026-04-16'), comprobante: 'gasto_1776347192.jpeg' },
    ],
  })
  console.log('✅ Gastos creados')

  // --- Otros ingresos ---
  await prisma.otroIngreso.createMany({
    data: [
      { id: 1, nombre: 'Saldo apertura tesorería 2026',     monto: 533059, comprobante: '',                          fecha: new Date('2026-04-05') },
      { id: 2, nombre: 'Traspaso directiva 2025 a 2026',    monto:      0, comprobante: 'pago_1775421336_otro.jpg', fecha: new Date('2026-04-05') },
      { id: 3, nombre: 'Intereses mercado pago',            monto:    384, comprobante: 'pago_1776267214_otro.jpg', fecha: new Date('2026-04-15') },
      { id: 4, nombre: 'Intereses mercado pago',            monto:     90, comprobante: 'pago_1776347149_otro.jpg', fecha: new Date('2026-04-16') },
      { id: 5, nombre: 'Intereses mercado pago',            monto:    122, comprobante: 'pago_1776448151_otro.jpg', fecha: new Date('2026-04-17') },
      { id: 6, nombre: 'Intereses mercado pago',            monto:    367, comprobante: 'pago_1776620621_otro.jpg', fecha: new Date('2026-04-19') },
      { id: 7, nombre: 'Intereses mercado pago',            monto:    110, comprobante: 'pago_1776782002_otro.jpg', fecha: new Date('2026-04-21') },
      { id: 8, nombre: 'Intereses mercado pago',            monto:    237, comprobante: 'pago_1776955065_otro.jpg', fecha: new Date('2026-04-23') },
    ],
  })
  console.log('✅ Otros ingresos creados')

  // --- Pagos ---
  await prisma.pago.createMany({
    data: [
      { id:  19, alumnoId:  1, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  20, alumnoId:  2, itemId: 10, monto: 25000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  21, alumnoId:  5, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  22, alumnoId:  6, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  23, alumnoId:  8, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  24, alumnoId: 10, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  25, alumnoId: 12, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  26, alumnoId: 13, itemId: 10, monto: 25000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  27, alumnoId: 14, itemId: 10, monto: 25000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  28, alumnoId: 16, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  29, alumnoId: 17, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  30, alumnoId: 18, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  31, alumnoId: 20, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  32, alumnoId: 23, itemId: 10, monto: 25000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  33, alumnoId: 24, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  34, alumnoId: 25, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  35, alumnoId: 26, itemId: 10, monto: 27000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  36, alumnoId: 28, itemId: 10, monto: 25000, comprobante: '',                             fecha: new Date('2026-04-05') },
      { id:  37, alumnoId: 19, itemId: 10, monto: 27000, comprobante: 'pago_1775694969_19.jpeg',     fecha: new Date('2026-04-08') },
      { id:  38, alumnoId:  4, itemId: 10, monto: 25000, comprobante: 'pago_1775765701_4.jpeg',      fecha: new Date('2026-04-09') },
      { id:  39, alumnoId: 27, itemId: 10, monto: 27000, comprobante: 'pago_1775768543_27.jpeg',     fecha: new Date('2026-04-09') },
      { id:  40, alumnoId: 11, itemId: 10, monto: 25000, comprobante: 'pago_1775783643_11.jpeg',     fecha: new Date('2026-04-09') },
      { id:  41, alumnoId: 22, itemId: 10, monto: 27000, comprobante: 'pago_1775857540_22.jpeg',     fecha: new Date('2026-04-10') },
      { id:  42, alumnoId: 11, itemId: 22, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  43, alumnoId: 11, itemId: 23, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  44, alumnoId: 11, itemId: 24, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  45, alumnoId: 11, itemId: 25, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  46, alumnoId: 11, itemId: 26, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  47, alumnoId: 11, itemId: 27, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  48, alumnoId: 11, itemId: 28, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  49, alumnoId: 11, itemId: 29, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  50, alumnoId: 11, itemId: 30, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  51, alumnoId: 11, itemId: 31, monto: 10000, comprobante: 'pago_1776212675_11.jpeg',     fecha: new Date('2026-04-14') },
      { id:  52, alumnoId: 19, itemId: 22, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  53, alumnoId: 19, itemId: 23, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  54, alumnoId: 19, itemId: 24, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  55, alumnoId: 19, itemId: 25, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  56, alumnoId: 19, itemId: 26, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  57, alumnoId: 19, itemId: 27, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  58, alumnoId: 19, itemId: 28, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  59, alumnoId: 19, itemId: 29, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  60, alumnoId: 19, itemId: 30, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  61, alumnoId: 19, itemId: 31, monto: 10000, comprobante: 'pago_1776265354_19.jpeg',     fecha: new Date('2026-04-15') },
      { id:  62, alumnoId: 20, itemId: 22, monto: 10000, comprobante: 'pago_1776266764_20.jpeg',     fecha: new Date('2026-04-15') },
      { id:  63, alumnoId:  4, itemId: 22, monto: 10000, comprobante: 'pago_1776266786_4.jpeg',      fecha: new Date('2026-04-15') },
      { id:  64, alumnoId:  4, itemId: 23, monto: 10000, comprobante: 'pago_1776266786_4.jpeg',      fecha: new Date('2026-04-15') },
      { id:  65, alumnoId:  4, itemId: 24, monto:  5000, comprobante: 'pago_1776266786_4.jpeg',      fecha: new Date('2026-04-15') },
      { id:  66, alumnoId: 17, itemId: 22, monto: 10000, comprobante: 'pago_1776270095_17.jpeg',     fecha: new Date('2026-04-15') },
      { id:  67, alumnoId: 17, itemId: 23, monto: 10000, comprobante: 'pago_1776270095_17.jpeg',     fecha: new Date('2026-04-15') },
      { id:  68, alumnoId: 17, itemId: 24, monto: 10000, comprobante: 'pago_1776270095_17.jpeg',     fecha: new Date('2026-04-15') },
      { id:  69, alumnoId: 17, itemId: 25, monto: 10000, comprobante: 'pago_1776270095_17.jpeg',     fecha: new Date('2026-04-15') },
      { id:  70, alumnoId: 17, itemId: 26, monto: 10000, comprobante: 'pago_1776270095_17.jpeg',     fecha: new Date('2026-04-15') },
      { id:  71, alumnoId: 16, itemId: 22, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  72, alumnoId: 16, itemId: 23, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  73, alumnoId: 16, itemId: 24, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  74, alumnoId: 16, itemId: 25, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  75, alumnoId: 16, itemId: 26, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  76, alumnoId: 16, itemId: 27, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  77, alumnoId: 16, itemId: 28, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  78, alumnoId: 16, itemId: 29, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  79, alumnoId: 16, itemId: 30, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  80, alumnoId: 16, itemId: 31, monto: 10000, comprobante: 'pago_1776294823_16.jpeg',     fecha: new Date('2026-04-15') },
      { id:  81, alumnoId:  3, itemId: 10, monto: 27000, comprobante: 'pago_1776349899_3.PNG',       fecha: new Date('2026-04-16') },
      { id:  82, alumnoId:  8, itemId: 22, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  83, alumnoId:  8, itemId: 23, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  84, alumnoId:  8, itemId: 24, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  85, alumnoId:  8, itemId: 25, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  86, alumnoId:  8, itemId: 26, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  87, alumnoId:  8, itemId: 27, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  88, alumnoId:  8, itemId: 28, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  89, alumnoId:  8, itemId: 29, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  90, alumnoId:  8, itemId: 30, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  91, alumnoId:  8, itemId: 31, monto: 10000, comprobante: 'pago_1776389034_8.jpeg',      fecha: new Date('2026-04-16') },
      { id:  92, alumnoId:  5, itemId: 22, monto: 10000, comprobante: 'pago_1776445653_5.jpeg',      fecha: new Date('2026-04-17') },
      { id:  93, alumnoId:  5, itemId: 23, monto: 10000, comprobante: 'pago_1776445653_5.jpeg',      fecha: new Date('2026-04-17') },
      { id:  94, alumnoId:  5, itemId: 24, monto: 10000, comprobante: 'pago_1776445653_5.jpeg',      fecha: new Date('2026-04-17') },
      { id:  95, alumnoId: 26, itemId: 22, monto: 10000, comprobante: 'pago_1776445758_26.jpeg',     fecha: new Date('2026-04-17') },
      { id:  96, alumnoId: 26, itemId: 23, monto: 10000, comprobante: 'pago_1776445758_26.jpeg',     fecha: new Date('2026-04-17') },
      { id:  97, alumnoId: 26, itemId: 24, monto: 10000, comprobante: 'pago_1776445758_26.jpeg',     fecha: new Date('2026-04-17') },
      { id:  98, alumnoId:  3, itemId: 22, monto: 10000, comprobante: 'pago_1776623735_3.jpeg',      fecha: new Date('2026-04-19') },
      { id:  99, alumnoId:  3, itemId: 23, monto: 10000, comprobante: 'pago_1776623735_3.jpeg',      fecha: new Date('2026-04-19') },
      { id: 100, alumnoId: 14, itemId: 22, monto: 10000, comprobante: 'pago_1776690981_14.jpeg',     fecha: new Date('2026-04-20') },
      { id: 101, alumnoId: 14, itemId: 23, monto: 10000, comprobante: 'pago_1776690981_14.jpeg',     fecha: new Date('2026-04-20') },
      { id: 102, alumnoId: 14, itemId: 24, monto: 10000, comprobante: 'pago_1776690981_14.jpeg',     fecha: new Date('2026-04-20') },
      { id: 103, alumnoId: 14, itemId: 25, monto: 10000, comprobante: 'pago_1776690981_14.jpeg',     fecha: new Date('2026-04-20') },
      { id: 104, alumnoId: 14, itemId: 26, monto: 10000, comprobante: 'pago_1776690981_14.jpeg',     fecha: new Date('2026-04-20') },
      { id: 105, alumnoId: 21, itemId: 10, monto: 27000, comprobante: 'pago_1776726753_21.jpeg',     fecha: new Date('2026-04-20') },
      { id: 106, alumnoId: 23, itemId: 10, monto:  2000, comprobante: 'pago_1776804303_23.jpeg',     fecha: new Date('2026-04-21') },
      { id: 107, alumnoId: 13, itemId: 10, monto:  2000, comprobante: 'pago_1776808478_13.jpeg',     fecha: new Date('2026-04-21') },
    ],
  })
  console.log('✅ Pagos creados')

  // Reset de secuencias autoincrement de Postgres (no aplica en SQLite)
  // porque al insertar IDs explícitos las sequences quedan desfasadas.
  if ((process.env.DATABASE_URL ?? '').startsWith('postgres')) {
    const tables: Array<[string, string]> = [
      ['usuarios',                  'usuario_id'],
      ['registro_accesos',          'id'],
      ['alumnos',                   'alumno_id'],
      ['apoderados',                'apoderado_id'],
      ['tallas_polerones',          'talla_id'],
      ['eleccion_polerones',        'eleccion_id'],
      ['categorias_items_pagar',    'categoria_id'],
      ['items_pagar',               'item_id'],
      ['pagos',                     'pago_id'],
      ['mercadopago_transacciones', 'mp_id'],
      ['gastos',                    'gasto_id'],
      ['otros_ingresos',            'ingreso_id'],
    ]
    for (const [table, pk] of tables) {
      try {
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"', '${pk}'), COALESCE((SELECT MAX("${pk}") FROM "${table}"), 1), true)`
        )
      } catch {
        // tabla sin secuencia (ej. si no aplica): ignorar
      }
    }
    console.log('✅ Secuencias Postgres reseteadas')
  }

  console.log('\n🎉 Seed completado!')
  console.log('   Usuario: tesorero    | Contraseña: tesorero2026')
  console.log('   Usuario: apoderado   | Contraseña: apoderado2026')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
