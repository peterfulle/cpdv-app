import { PrismaClient } from '@prisma/client'
process.env.DATABASE_URL='postgresql://cpdv:OgpdWr2rhGcp1b7sbX3zMsGoCzMYcd8W@dpg-d7no0ku8bjmc738vgu90-a.oregon-postgres.render.com:5432/cpdv?sslmode=require'
const p = new PrismaClient()
const [pagos, otros, gastos] = await Promise.all([
  p.pago.findMany({ select:{id:true,monto:true,fecha:true,comprobante:true,alumnoId:true} }),
  p.otroIngreso.findMany({ select:{id:true,monto:true,fecha:true,comprobante:true,nombre:true} }),
  p.gasto.aggregate({_sum:{monto:true},_count:true}),
])
const sum = a => a.reduce((s,x)=>s+x.monto,0)
const pMp = pagos.filter(x=>x.comprobante?.startsWith('mp_'))
const pMan = pagos.filter(x=>!x.comprobante?.startsWith('mp_'))
const oMp = otros.filter(x=>x.comprobante?.startsWith('mp_'))
const oMan = otros.filter(x=>!x.comprobante?.startsWith('mp_'))
console.log('=== TOTALES ===')
console.log('pagos:', pagos.length, sum(pagos))
console.log('  mp:',  pMp.length, sum(pMp))
console.log('  man:', pMan.length, sum(pMan))
console.log('otros:', otros.length, sum(otros))
console.log('  mp:',  oMp.length, sum(oMp))
console.log('  man:', oMan.length, sum(oMan))
console.log('gastos:', gastos._count, gastos._sum.monto)
console.log('B actual:', sum(pagos)+sum(otros)-(gastos._sum.monto??0))

const pmpKeys = new Set(pMp.map(x=>x.comprobante))
const dupExact = oMp.filter(o=>pmpKeys.has(o.comprobante))
console.log('\n=== DUP EXACT (mismo comprobante en pagos y otros) ===')
console.log('count:', dupExact.length, 'monto:', sum(dupExact))

console.log('\n=== HEURISTICO (pago manual ≈ otro ingreso, mismo monto, ±2 días) ===')
const hits=[]
for (const pa of pMan) for (const o of otros) {
  if (pa.monto!==o.monto) continue
  if (Math.abs(pa.fecha-o.fecha) <= 2*86400000) hits.push({pid:pa.id,oid:o.id,monto:pa.monto,pf:pa.fecha.toISOString().slice(0,10),of:o.fecha.toISOString().slice(0,10),nombre:o.nombre,comp:o.comprobante})
}
console.log('count:', hits.length, 'monto potencial:', hits.reduce((s,h)=>s+h.monto,0))
hits.slice(0,30).forEach(h=>console.log(' ', JSON.stringify(h)))

console.log('\n=== TODOS LOS OTROS (auto-import MP) ===')
otros.forEach(o=>console.log(' ', o.id, '|', o.fecha.toISOString().slice(0,10), '|', o.monto.toString().padStart(10), '|', o.comprobante, '|', o.nombre))

await p.$disconnect()
