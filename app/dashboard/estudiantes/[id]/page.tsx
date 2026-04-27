'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, Clock, AlertCircle,
  CreditCard, FileText, Package, Calendar,
  User, Users, Download, Plus,
} from 'lucide-react'
import { tokens } from '@/styles/theme'
import { formatCLP, formatDate, getInitials } from '@/lib/utils'
import { useFetch } from '@/lib/useFetch'

// ── Animations ────────────────────────────────────────────────────────
const shimmer = keyframes`
  from { background-position: -200% 0 }
  to   { background-position:  200% 0 }
`

// ── Styled components ─────────────────────────────────────────────────
const Page = styled.div`
  padding: 28px 32px;
  max-width: 1100px;
  @media (max-width: 768px) { padding: 16px; }
`

const BackBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color:${tokens.gray[500]};
  background: none; border: none; cursor: pointer; padding: 0;
  margin-bottom: 20px;
  &:hover { color:${tokens.gray[800]}; }
`

const HeroCard = styled(motion.div)`
  background: linear-gradient(135deg, ${tokens.brand[600]}, ${tokens.brand[800]});
  border-radius: 18px;
  padding: 24px 28px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`

const Avatar = styled.div`
  width: 64px; height: 64px;
  background: rgba(255,255,255,.2);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 800;
  flex-shrink: 0;
`

const HeroInfo = styled.div`
  flex: 1;
  h1 { font-size:22px; font-weight:800; margin-bottom:4px; }
  p  { font-size:13px; opacity:.8; }
`

const HeroStats = styled.div`
  display: flex; gap: 24px; flex-wrap: wrap;
`

const HeroStat = styled.div`
  text-align: right;
  span   { display:block; font-size:11px; opacity:.7; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
  strong { font-size:20px; font-weight:800; }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

const Card = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 16px;
  overflow: hidden;
`

const CardHeader = styled.div`
  padding: 16px 20px 12px;
  border-bottom: 1px solid ${tokens.gray[50]};
  display: flex; align-items: center; justify-content: space-between;
  h2 { font-size:14px; font-weight:700; color:${tokens.gray[800]}; }
  span { font-size:11.5px; color:${tokens.gray[400]}; }
`

const ItemRow = styled.div`
  padding: 14px 20px;
  border-bottom: 1px solid ${tokens.gray[50]};
  &:last-of-type { border-bottom: none; }
`

const ItemHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
`

const ItemTitle = styled.div`
  display: flex; align-items: center; gap: 8px;
  span { font-size:13.5px; font-weight:600; color:${tokens.gray[800]}; }
`

const ItemPill = styled.span<{ tipo: number }>`
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10.5px; font-weight: 600;
  padding: 2px 8px; border-radius: 99px;
  background: ${p => p.tipo === 1 ? tokens.brand[500]+'18' : tokens.amber[500]+'18'};
  color: ${p => p.tipo === 1 ? tokens.brand[600] : tokens.amber[600]};
`

const ItemAmounts = styled.div`
  display: flex; gap: 16px; font-size:12px;
  span { color:${tokens.gray[500]}; }
  strong { color:${tokens.gray[800]}; }
`

const ProgWrap = styled.div`
  margin-top: 6px;
`

const ProgBar = styled.div`
  height: 6px; background:${tokens.gray[100]}; border-radius:99px; overflow:hidden;
  div { height:100%; border-radius:99px; transition: width .7s cubic-bezier(.16,1,.3,1); }
`

const PagoHistorial = styled.div`
  padding: 12px 20px;
`

const PagoItem = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid ${tokens.gray[50]};
  &:last-child { border-bottom:none; }
`

const PagoIcon = styled.div<{ tipo: number }>`
  width: 32px; height: 32px;
  border-radius: 9px; flex-shrink: 0;
  background: ${p => p.tipo === 1 ? tokens.brand[500]+'18' : tokens.amber[500]+'18'};
  color: ${p => p.tipo === 1 ? tokens.brand[600] : tokens.amber[600]};
  display: flex; align-items: center; justify-content: center;
`

const PagoMeta = styled.div`
  flex: 1;
  p { font-size:13px; font-weight:600; color:${tokens.gray[800]}; line-height:1.3; }
  span { font-size:11.5px; color:${tokens.gray[400]}; }
`

const PagoBadge = styled.span`
  font-size:13px; font-weight:700; color:${tokens.emerald[600]};
`

const ComprobanteLink = styled.a`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; color:${tokens.brand[500]}; text-decoration:none;
  padding: 3px 8px; border-radius: 6px; background: ${tokens.brand[500]+'12'};
  &:hover { background:${tokens.brand[500]+'25'}; }
`

const AddBtn = styled(Link)`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 10px;
  font-size: 12.5px; font-weight: 600; color: #fff;
  background: ${tokens.brand[500]};
  text-decoration: none;
  transition: background .15s;
  &:hover { background: ${tokens.brand[600]}; }
`

const Skeleton = styled.div`
  background: linear-gradient(90deg, ${tokens.gray[100]} 25%, ${tokens.gray[200]} 50%, ${tokens.gray[100]} 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
`

const EmptyPagos = styled.div`
  text-align: center; padding: 32px 20px; color:${tokens.gray[400]};
  p { font-size:13px; margin-top:6px; }
`

// ── Component ─────────────────────────────────────────────────────────
export default function EstudianteDetallePage() {
  const { id } = useParams()
  const router = useRouter()
  const { data, isLoading } = useFetch<any>(`/api/alumnos/${id}`)

  if (isLoading) {
    return (
      <Page>
        <BackBtn onClick={() => router.back()}><ArrowLeft size={14} /> Volver</BackBtn>
        <Skeleton style={{ height: 140, marginBottom: 24 }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20 }}>
          <Skeleton style={{ height: 400 }} />
          <Skeleton style={{ height: 400 }} />
        </div>
      </Page>
    )
  }

  if (!data) return null

  const { alumno, items, pagos } = data

  const totalDeuda   = items.reduce((s: number, i: any) => s + i.valor, 0)
  const totalPagado  = items.reduce((s: number, i: any) => s + i.pagado, 0)
  const saldo        = totalDeuda - totalPagado
  const pctGeneral   = totalDeuda > 0 ? Math.round((totalPagado / totalDeuda) * 100) : 0
  const estadoGeneral = saldo <= 0 ? 'paid' : totalPagado > 0 ? 'partial' : 'pending'

  const estadoColor  = estadoGeneral === 'paid' ? tokens.emerald[500]
    : estadoGeneral === 'partial' ? tokens.amber[500]
    : tokens.rose[400]

  const apoderadosStr = alumno.apoderados.filter((ap: string) => ap !== 'N/A').join(', ') || 'Sin apoderado'

  return (
    <Page>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <BackBtn onClick={() => router.back()}>
          <ArrowLeft size={14} /> Volver a Estudiantes
        </BackBtn>
        <AddBtn href={`/dashboard/pagos/nuevo?alumnoId=${id}`}>
          <Plus size={14} /> Registrar Pago
        </AddBtn>
      </div>

      {/* Hero */}
      <HeroCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
        <Avatar>{getInitials(alumno.nombre)}</Avatar>
        <HeroInfo>
          <h1>{alumno.nombre}</h1>
          <p style={{ display:'flex', alignItems:'center', gap:6 }}>
            <Users size={12} /> {apoderadosStr}
            {alumno.tallaPoleron && (
              <span style={{ marginLeft:12, display:'flex', alignItems:'center', gap:5 }}>
                <Package size={12} /> Poleron Talla {alumno.tallaPoleron.nombre} ({formatCLP(alumno.tallaPoleron.valor)})
              </span>
            )}
          </p>
        </HeroInfo>
        <HeroStats>
          <HeroStat>
            <span>Pagado</span>
            <strong>{formatCLP(totalPagado)}</strong>
          </HeroStat>
          <HeroStat>
            <span>Pendiente</span>
            <strong style={{ color: saldo > 0 ? '#fca5a5' : '#86efac' }}>
              {saldo > 0 ? formatCLP(saldo) : '✓ Al día'}
            </strong>
          </HeroStat>
          <HeroStat>
            <span>Progreso</span>
            <strong>{pctGeneral}%</strong>
          </HeroStat>
        </HeroStats>
      </HeroCard>

      {/* Total progress */}
      <div style={{ marginBottom:24, background:'#fff', border:`1px solid ${tokens.gray[100]}`, borderRadius:12, padding:'14px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:12.5, color:tokens.gray[500] }}>
          <span>Progreso general de pago</span>
          <span style={{ fontWeight:700, color: estadoColor }}>{pctGeneral}%</span>
        </div>
        <ProgBar>
          <div style={{ width:`${pctGeneral}%`, background: estadoColor }} />
        </ProgBar>
      </div>

      <Grid>
        {/* Items de pago */}
        <Card initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
          <CardHeader>
            <h2>Ítems de Pago</h2>
            <span>{items.filter((i: any) => i.pendiente <= 0).length} / {items.length} pagados</span>
          </CardHeader>
          {items.map((item: any) => {
            const color = item.pendiente <= 0 ? tokens.emerald[500]
              : item.pagado > 0 ? tokens.amber[500]
              : tokens.rose[400]
            const Icon = item.tipo === 1 ? Package : CreditCard

            return (
              <ItemRow key={item.id}>
                <ItemHeader>
                  <ItemTitle>
                    <Icon size={14} color={color} />
                    <span>{item.nombre}</span>
                    <ItemPill tipo={item.tipo}>
                      {item.tipo === 1 ? 'Poleron' : 'Cuota'}
                    </ItemPill>
                  </ItemTitle>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    {item.pendiente <= 0
                      ? <CheckCircle2 size={15} color={tokens.emerald[500]} />
                      : item.pagado > 0
                      ? <Clock size={15} color={tokens.amber[500]} />
                      : <AlertCircle size={15} color={tokens.rose[400]} />
                    }
                    <span style={{ fontSize:12.5, fontWeight:700, color }}>
                      {item.porcentaje}%
                    </span>
                  </div>
                </ItemHeader>

                <ProgWrap>
                  <ProgBar>
                    <div style={{ width:`${item.porcentaje}%`, background: color }} />
                  </ProgBar>
                </ProgWrap>

                <ItemAmounts style={{ marginTop:8 }}>
                  <div><span>Total: </span><strong>{formatCLP(item.valor)}</strong></div>
                  <div><span>Pagado: </span><strong style={{ color: tokens.emerald[600] }}>{formatCLP(item.pagado)}</strong></div>
                  {item.pendiente > 0 && (
                    <div><span>Pendiente: </span><strong style={{ color: tokens.rose[500] }}>{formatCLP(item.pendiente)}</strong></div>
                  )}
                </ItemAmounts>
              </ItemRow>
            )
          })}
        </Card>

        {/* Historial de pagos */}
        <Card initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}>
          <CardHeader>
            <h2>Historial de Pagos</h2>
            <span>{pagos.length} transacciones</span>
          </CardHeader>
          {pagos.length === 0 ? (
            <EmptyPagos>
              <CreditCard size={32} style={{ opacity:.3, margin:'0 auto', display:'block' }} />
              <p>Sin pagos registrados aún</p>
            </EmptyPagos>
          ) : (
            <PagoHistorial>
              {pagos.map((p: any) => (
                <PagoItem key={p.id}>
                  <PagoIcon tipo={p.tipo}>
                    {p.tipo === 1 ? <Package size={14} /> : <CreditCard size={14} />}
                  </PagoIcon>
                  <PagoMeta>
                    <p>{p.itemNombre}</p>
                    <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={10} /> {formatDate(p.fecha)}
                    </span>
                  </PagoMeta>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                    <PagoBadge>{formatCLP(p.monto)}</PagoBadge>
                    {p.comprobante && (
                      <ComprobanteLink href={`/uploads/comprobantes/${p.comprobante}`} target="_blank">
                        <Download size={10} /> Ver
                      </ComprobanteLink>
                    )}
                  </div>
                </PagoItem>
              ))}
            </PagoHistorial>
          )}
        </Card>
      </Grid>
    </Page>
  )
}
