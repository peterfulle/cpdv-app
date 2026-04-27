'use client'

import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, Users, ShoppingBag,
  Calendar, AlertCircle, CheckCircle2, Clock, ArrowUpRight,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { tokens } from '@/styles/theme'
import { formatCLP, formatDate, calcPercent } from '@/lib/utils'

const TEAL = '#22b2b2'

// ── Styled components ────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px 36px;
  max-width: 1360px;
  @media (max-width: 768px) { padding: 18px 16px; }
`

const PageHeader = styled.div`
  margin-bottom: 32px;
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: ${tokens.gray[900]};
    letter-spacing: -.3px;
  }
  p { color: ${tokens.gray[400]}; font-size: 13px; margin-top: 3px; }
`

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
`

const KPICard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`

const KPIIcon = styled.div`
  margin-bottom: 10px;
  color: ${tokens.gray[300]};
`

const KPIValue = styled.div`
  font-size: 26px;
  font-weight: 800;
  color: ${tokens.gray[900]};
  letter-spacing: -.5px;
  line-height: 1;
  margin-bottom: 4px;
`

const KPILabel = styled.div`
  font-size: 12px;
  color: ${tokens.gray[400]};
  font-weight: 500;
`

const KPIChange = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 500;
  color: ${tokens.gray[400]};
`

const ProgressBase = styled.div`
  width: 100%;
  height: 4px;
  background: ${tokens.gray[100]};
  border-radius: 99px;
  overflow: hidden;
  margin-top: 10px;
`

const ProgressFill = styled.div<{ pct: number; color: string }>`
  height: 100%;
  width: ${p => p.pct}%;
  background: ${p => p.color};
  border-radius: 99px;
  transition: width .8s cubic-bezier(.16,1,.3,1);
`

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`

const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`

const Panel = styled.div`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`

const PanelTitle = styled.h2`
  font-size: 13.5px;
  font-weight: 700;
  color: ${tokens.gray[700]};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    padding: 7px 10px;
    color: ${tokens.gray[400]};
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .6px;
    border-bottom: 1px solid ${tokens.gray[100]};
  }
  td {
    padding: 10px;
    color: ${tokens.gray[700]};
    border-bottom: 1px solid ${tokens.gray[50]};
    &:last-child { text-align: right; }
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${tokens.gray[50]}; }
`

const PctBadge = styled.span<{ pct: number }>`
  font-size: 12px;
  font-weight: 700;
  color: ${tokens.gray[600]};
`

const AlertBadge = styled.div<{ type: 'warn' | 'ok' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  background: ${tokens.gray[50]};
  color: ${tokens.gray[600]};
  border-left: 2px solid ${p => ({ warn: tokens.amber[500], ok: tokens.emerald[500], info: TEAL })[p.type]};
  margin-bottom: 7px;
`

const Skeleton = styled.div`
  background: linear-gradient(90deg, ${tokens.gray[100]} 25%, ${tokens.gray[200]} 50%, ${tokens.gray[100]} 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  @keyframes shimmer { from { background-position:-200% 0 } to { background-position:200% 0 } }
`

// ── Custom Tooltip ────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:`1px solid ${tokens.gray[100]}`, borderRadius:10, padding:'10px 14px', boxShadow:'0 4px 16px rgba(0,0,0,.08)', fontSize:12.5 }}>
      <p style={{ fontWeight:600, marginBottom:4, color: tokens.gray[700] }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCLP(p.value)}
        </p>
      ))}
    </div>
  )
}

const COLORS = [TEAL, '#94a3b8', '#cbd5e1', '#e2e8f0']

// ── Component ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, isLoading } = useFetch<any>('/api/dashboard', { refreshInterval: 30000 })
  const { data: conc } = useFetch<any>('/api/conciliacion', { refreshInterval: 30000 })

  const kpis          = data?.kpis
  const recentPayments = data?.recentPayments ?? []
  const monthlyData    = data?.monthlyData ?? []

  const now     = new Date()
  const dateStr = now.toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

  return (
    <Page>
      <PageHeader>
        <h1>Tesorería · Dashboard</h1>
        <p style={{ textTransform: 'capitalize' }}>{dateStr}</p>
      </PageHeader>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <KPIGrid>
        <KPICard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0 }}>
          <KPIIcon><Wallet size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:130, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.saldoCaja ?? 0)}</KPIValue>
          }
          <KPILabel>Saldo contable (caja)</KPILabel>
          <KPIChange>
            <ArrowUpRight size={11} />
            DB local · ingresos − gastos
          </KPIChange>
        </KPICard>

        <KPICard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.06 }}>
          <KPIIcon><TrendingUp size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:110, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.totalIngresos ?? 0)}</KPIValue>
          }
          <KPILabel>Total ingresos</KPILabel>
          <KPIChange>
            <CheckCircle2 size={11} />
            Cuotas y polerones
          </KPIChange>
        </KPICard>

        <KPICard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.12 }}>
          <KPIIcon><TrendingDown size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:90, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.totalGastos ?? 0)}</KPIValue>
          }
          <KPILabel>Total gastos</KPILabel>
          <KPIChange>
            <AlertCircle size={11} />
            {kpis?.totalGastos ? `${calcPercent(kpis.totalGastos, kpis.totalIngresos)}% de ingresos` : '--'}
          </KPIChange>
        </KPICard>

        <KPICard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.18 }}>
          <KPIIcon><Users size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:50, marginBottom:6 }} />
            : <KPIValue>{kpis?.totalAlumnos ?? 0}</KPIValue>
          }
          <KPILabel>Estudiantes</KPILabel>
          <KPIChange>
            <Clock size={11} />
            {kpis?.alumnosPendientesCuotas ?? 0} con cuotas pendientes
          </KPIChange>
        </KPICard>
      </KPIGrid>

      {/* ── Conciliación bancaria MP ↔ contabilidad curso ─────────── */}
      {conc && (
        <Panel style={{ marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Wallet size={14} color={TEAL} />
            <span style={{ fontWeight:700, fontSize:13, color:tokens.gray[700] }}>
              Conciliación · cuenta bancaria MP vs. contabilidad del curso
            </span>
            <span style={{ marginLeft:'auto', fontSize:11, color:tokens.gray[400] }}>
              {conc.saldoBancarioMP?.disponible
                ? `Sincronizado ${new Date(conc.saldoBancarioMP.ultimaSincronizacion).toLocaleString('es-CL')}`
                : 'Saldo MP no sincronizado'}
            </span>
          </div>

          <div style={{
            display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14,
          }}>
            {/* A. Saldo bancario MP */}
            <div style={{
              padding:'14px 16px', border:'1px solid #34d39933',
              borderRadius:10, background:'#34d39908',
            }}>
              <div style={{ fontSize:11, color:'#047857', fontWeight:600, marginBottom:6 }}>
                A · SALDO BANCARIO MP
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:tokens.gray[900], marginBottom:4 }}>
                {conc.saldoBancarioMP?.disponible
                  ? formatCLP(conc.saldoBancarioMP.valor)
                  : '—'}
              </div>
              <div style={{ fontSize:11, color:tokens.gray[400] }}>
                Cuenta MercadoPago · neto de retiros
                {conc.saldoBancarioMP?.interesAbonadoMP !== null && (
                  <> · interés abonado {formatCLP(conc.saldoBancarioMP.interesAbonadoMP)}</>
                )}
              </div>
            </div>

            {/* B. Neto contable curso */}
            <div style={{
              padding:'14px 16px', border:`1px solid ${tokens.gray[100]}`,
              borderRadius:10,
            }}>
              <div style={{ fontSize:11, color:tokens.gray[500], fontWeight:600, marginBottom:6 }}>
                B · NETO CONTABLE CURSO
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:tokens.gray[900], marginBottom:4 }}>
                {formatCLP(conc.contabilidadCurso.netoCurso)}
              </div>
              <div style={{ fontSize:11, color:tokens.gray[400] }}>
                Ingresos {formatCLP(conc.contabilidadCurso.ingresosTotales)} − gastos {formatCLP(conc.contabilidadCurso.gastos.total)}
              </div>
            </div>

            {/* A − B */}
            <div style={{
              padding:'14px 16px',
              border:`1px solid ${conc.conciliacion.diferencia === null ? tokens.gray[100] : conc.conciliacion.diferencia === 0 ? '#34d39955' : '#f59e0b55'}`,
              borderRadius:10,
              background: conc.conciliacion.diferencia === 0 ? '#34d39908' : conc.conciliacion.diferencia === null ? 'transparent' : '#f59e0b08',
            }}>
              <div style={{ fontSize:11, color:tokens.gray[500], fontWeight:600, marginBottom:6 }}>
                DIFERENCIA (A − B)
              </div>
              <div style={{ fontSize:22, fontWeight:800, color:tokens.gray[900], marginBottom:4 }}>
                {conc.conciliacion.diferencia === null
                  ? '—'
                  : (conc.conciliacion.diferencia >= 0 ? '+' : '') + formatCLP(conc.conciliacion.diferencia)}
              </div>
              <div style={{ fontSize:11, color:tokens.gray[400], lineHeight:1.5 }}>
                {conc.conciliacion.explicacion}
              </div>
            </div>
          </div>

          <div style={{
            marginTop:14, padding:'10px 14px', background:tokens.gray[50],
            borderRadius:8, fontSize:11, color:tokens.gray[500], lineHeight:1.6,
          }}>
            <b>¿Por qué pueden no coincidir?</b> El saldo MP es la cuenta bancaria real
            (incluye intereses, retiros y depósitos). El neto contable es lo que se ha
            registrado manualmente como pagos, otros ingresos y gastos del curso.
            Coinciden solo si todo el dinero del curso pasa por MP y todos los movimientos
            se registran en ambos lados.
          </div>
        </Panel>
      )}

      {/* ── Collection progress cards ──────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14, marginBottom:20 }}>
        <Panel>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <ShoppingBag size={14} color={tokens.gray[300]} />
            <span style={{ fontWeight:700, fontSize:13, color:tokens.gray[700] }}>Polerones</span>
            <span style={{ marginLeft:'auto' }}>
              <PctBadge pct={kpis?.percPoleron ?? 0}>{kpis?.percPoleron ?? 0}%</PctBadge>
            </span>
          </div>
          <ProgressBase>
            <ProgressFill pct={kpis?.percPoleron ?? 0} color={TEAL} />
          </ProgressBase>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11.5, color:tokens.gray[400] }}>
            <span>{formatCLP(kpis?.recaudadoPoleron ?? 0)} recaudado</span>
            <span>Meta {formatCLP(kpis?.metaPoleron ?? 0)}</span>
          </div>
        </Panel>

        <Panel>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <Calendar size={14} color={tokens.gray[300]} />
            <span style={{ fontWeight:700, fontSize:13, color:tokens.gray[700] }}>Cuotas</span>
            <span style={{ marginLeft:'auto' }}>
              <PctBadge pct={kpis?.percCuotas ?? 0}>{kpis?.percCuotas ?? 0}%</PctBadge>
            </span>
          </div>
          <ProgressBase>
            <ProgressFill pct={kpis?.percCuotas ?? 0} color={TEAL} />
          </ProgressBase>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:11.5, color:tokens.gray[400] }}>
            <span>{formatCLP(kpis?.recaudadoCuotas ?? 0)} recaudado</span>
            <span>Meta {formatCLP(kpis?.metaCuotas ?? 0)}</span>
          </div>
        </Panel>
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <ChartsGrid>
        <Panel>
          <PanelTitle>
            Ingresos por mes
            <span style={{ fontSize:11, fontWeight:400, color:tokens.gray[400] }}>Cuotas + Polerones</span>
          </PanelTitle>
          {isLoading
            ? <Skeleton style={{ height:200 }} />
            : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyData} margin={{ top:4, right:4, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="gradCuotas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#94a3b8" stopOpacity={.12} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}  />
                    </linearGradient>
                    <linearGradient id="gradPoleron" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={TEAL} stopOpacity={.15} />
                      <stop offset="95%" stopColor={TEAL} stopOpacity={0}  />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} />
                  <XAxis dataKey="mes" tick={{ fontSize:10.5, fill:tokens.gray[400] }} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize:10.5, fill:tokens.gray[400] }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:12 }} />
                  <Area type="monotone" dataKey="cuotas"  name="Cuotas"  stroke="#94a3b8" fill="url(#gradCuotas)"  strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="poleron" name="Polerón" stroke={TEAL}                fill="url(#gradPoleron)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </Panel>

        <Panel>
          <PanelTitle>Composición</PanelTitle>
          {isLoading ? <Skeleton style={{ height:200 }} /> : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Polerones', value: kpis?.recaudadoPoleron ?? 0 },
                    { name: 'Cuotas',    value: kpis?.recaudadoCuotas ?? 0 },
                    { name: 'Otros',     value: kpis?.otrosIngresos ?? 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCLP(Number(v))} />
                <Legend
                  formatter={(value) => <span style={{ fontSize:11.5, color:tokens.gray[600] }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </ChartsGrid>

      {/* ── Bottom panels ─────────────────────────────────────────── */}
      <BottomGrid>
        <Panel>
          <PanelTitle>Alertas</PanelTitle>
          {isLoading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {[1,2,3].map(i => <Skeleton key={i} style={{ height:38 }} />)}
            </div>
          ) : (
            <>
              {(kpis?.alumnosPendientesPoleron ?? 0) > 0 && (
                <AlertBadge type="warn">
                  <AlertCircle size={14} />
                  <span><b>{kpis.alumnosPendientesPoleron} estudiantes</b> con polerón pendiente</span>
                </AlertBadge>
              )}
              {(kpis?.alumnosPendientesCuotas ?? 0) > 0 && (
                <AlertBadge type="warn">
                  <Clock size={14} />
                  <span><b>{kpis.alumnosPendientesCuotas} estudiantes</b> con cuotas pendientes</span>
                </AlertBadge>
              )}
              {(kpis?.percPoleron ?? 0) >= 100 && (
                <AlertBadge type="ok">
                  <CheckCircle2 size={14} />
                  <span>Recaudación de polerones completada</span>
                </AlertBadge>
              )}
              {(kpis?.saldoCaja ?? 0) > 100000 && (
                <AlertBadge type="info">
                  <Wallet size={14} />
                  <span>Saldo disponible para actividades</span>
                </AlertBadge>
              )}
            </>
          )}
        </Panel>

        <Panel>
          <PanelTitle>
            Últimos pagos
            <a href="/dashboard/pagos" style={{ fontSize:11.5, color:TEAL, fontWeight:600, textDecoration:'none' }}>
              Ver todos →
            </a>
          </PanelTitle>
          {isLoading ? <Skeleton style={{ height:200 }} /> : (
            <Table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Ítem</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0,6).map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {p.alumnoNombre.split(',')[0]}
                    </td>
                    <td style={{ color:tokens.gray[400], fontSize:12 }}>
                      {p.itemNombre}
                    </td>
                    <td>
                      <span style={{ fontWeight:700, color:tokens.gray[700], fontSize:12.5 }}>
                        {formatCLP(p.monto)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </BottomGrid>
    </Page>
  )
}

