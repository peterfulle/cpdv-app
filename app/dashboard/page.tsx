'use client'

import { useState, useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, TrendingUp, TrendingDown, Users, ShoppingBag,
  Calendar, AlertCircle, CheckCircle2, Clock, ArrowUpRight,
  X, RefreshCw, ArrowDownLeft, ArrowUpRight as ArrowUpRightIcon,
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

  // ── Modales en tiempo real ──────────────────────────────────────────
  const [showSaldoModal, setShowSaldoModal] = useState(false)
  const [showGastosModal, setShowGastosModal] = useState(false)
  const [syncingSaldo, setSyncingSaldo] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  // Helper: dispara sync release_report y espera resultado
  const sincronizarSaldoMP = async () => {
    setSyncingSaldo(true)
    setSyncStatus('Solicitando reporte oficial a MercadoPago…')
    try {
      const post = await fetch('/api/mercadopago/fondo/sync', { method: 'POST' })
      const postJson = await post.json()
      if (!post.ok || !postJson.taskId) {
        setSyncStatus(`Error: ${postJson.error ?? 'no se pudo iniciar'}`)
        return
      }
      setSyncStatus('MercadoPago está procesando el reporte (puede tardar 30-60s)…')
      const t0 = Date.now()
      while (Date.now() - t0 < 120_000) {
        await new Promise(r => setTimeout(r, 5000))
        const get = await fetch(`/api/mercadopago/fondo/sync?taskId=${postJson.taskId}`)
        const j = await get.json()
        if (j.ready) {
          setSyncStatus(`Listo · saldo real ${formatCLP(j.saldoReal)} · gastos MP ${formatCLP(j.totalGastosMp ?? 0)}`)
          // Forzar revalidación del dashboard
          await fetch('/api/dashboard', { cache: 'reload' })
          setTimeout(() => setSyncStatus(null), 5000)
          return
        }
        if (j.status === 'failed' || j.status === 'error') {
          setSyncStatus(`MercadoPago reportó error: ${j.error}`)
          return
        }
        setSyncStatus(`Estado: ${j.status}…`)
      }
      setSyncStatus('Tiempo de espera agotado. Intenta de nuevo.')
    } catch (e: any) {
      setSyncStatus(`Error: ${e?.message ?? 'desconocido'}`)
    } finally {
      setSyncingSaldo(false)
    }
  }

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
        <KPICard
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0 }}
          onClick={() => setShowSaldoModal(true)}
          style={{ cursor:'pointer' }}
          title="Click para ver detalle en tiempo real"
        >
          <KPIIcon><Wallet size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:130, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.saldoCaja ?? 0)}</KPIValue>
          }
          <KPILabel>
            Saldo caja {kpis?.saldoSource === 'mp_real'
              ? <span style={{ color:'#10b981', fontWeight:700 }}>· MP real-time</span>
              : <span style={{ color:'#f59e0b', fontWeight:700 }}>· legacy (sin sync)</span>}
          </KPILabel>
          <KPIChange>
            <ArrowUpRight size={11} />
            {kpis?.saldoSource === 'mp_real'
              ? `+${formatCLP(Math.round((kpis?.interesPorSegundo ?? 0) * 86400))}/día interés`
              : 'Click "Sincronizar" para conectar con MP'}
          </KPIChange>
        </KPICard>

        <KPICard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.06 }}>
          <KPIIcon><TrendingUp size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:110, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.totalIngresos ?? 0)}</KPIValue>
          }
          <KPILabel>Ingresos a MP</KPILabel>
          <KPIChange>
            <CheckCircle2 size={11} />
            Depósitos a la cuenta
          </KPIChange>
        </KPICard>

        <KPICard
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.12 }}
          onClick={() => { window.location.href = '/dashboard/gastos' }}
          style={{ cursor:'pointer' }}
          title="Ver registro de gastos"
        >
          <KPIIcon><TrendingDown size={14} /></KPIIcon>
          {isLoading
            ? <Skeleton style={{ height:28, width:90, marginBottom:6 }} />
            : <KPIValue>{formatCLP(kpis?.totalGastos ?? 0)}</KPIValue>
          }
          <KPILabel>Gastos</KPILabel>
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

      {/* ── Modal: Saldo MP en tiempo real ─────────────────────────── */}
      <AnimatePresence>
        {showSaldoModal && (
          <SaldoModal
            onClose={() => setShowSaldoModal(false)}
            onSync={sincronizarSaldoMP}
            syncing={syncingSaldo}
            syncStatus={syncStatus}
            saldoSource={kpis?.saldoSource}
            saldoBaseFecha={kpis?.saldoBaseFecha}
            interesPorSegundo={kpis?.interesPorSegundo ?? 0}
          />
        )}
      </AnimatePresence>

      {/* ── Modal: Transferencias emitidas (gastos reales MP) ──────── */}
      <AnimatePresence>
        {showGastosModal && (
          <GastosModal onClose={() => setShowGastosModal(false)} />
        )}
      </AnimatePresence>

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

// ════════════════════════════════════════════════════════════════════════
// MODAL: Saldo MP en tiempo real
// ════════════════════════════════════════════════════════════════════════
const Backdrop = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(15,23,42,.55);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`
const ModalBox = styled(motion.div)`
  background: #fff; border-radius: 16px; max-width: 920px; width: 100%;
  max-height: 88vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,.25);
`
const ModalHead = styled.div`
  padding: 18px 22px; border-bottom: 1px solid ${tokens.gray[100]};
  display: flex; align-items: center; gap: 14px;
  h3 { font-size: 15px; font-weight: 700; color: ${tokens.gray[900]}; flex: 1; }
`
const ModalBody = styled.div`
  padding: 18px 22px; overflow-y: auto; flex: 1;
`
const LiveDot = styled.span`
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: #10b981; margin-right: 6px;
  animation: pulse 1.6s ease-in-out infinite;
  @keyframes pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: .35; transform: scale(.7); }
  }
`
const SmallBtn = styled.button`
  background: ${TEAL}; color: #fff; border: 0; padding: 7px 14px;
  border-radius: 8px; font-size: 12.5px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  &:hover { background: #1e9999; }
  &:disabled { opacity: .5; cursor: not-allowed; }
`
const IconBtn = styled.button`
  background: transparent; border: 0; cursor: pointer; padding: 6px;
  border-radius: 6px; color: ${tokens.gray[400]};
  &:hover { background: ${tokens.gray[100]}; color: ${tokens.gray[700]}; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

function formatFechaMP(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit',
    })
  } catch { return iso }
}

interface SaldoModalProps {
  onClose: () => void
  onSync: () => void
  syncing: boolean
  syncStatus: string | null
  saldoSource?: 'mp_real' | 'legacy'
  saldoBaseFecha?: string | null
  interesPorSegundo: number
}

function SaldoModal({ onClose, onSync, syncing, syncStatus, saldoSource, saldoBaseFecha, interesPorSegundo }: SaldoModalProps) {
  // Polleamos el saldo cada 5s
  const { data, mutate } = useFetch<any>('/api/mercadopago/balance-live?limit=30', { refreshInterval: 5000 })

  // Tick local cada 250ms para mostrar el interés segundo a segundo entre polls
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const saldoBase = data?.saldoLive ?? 0
  const baseTimestamp = data?.timestampCalculo ? new Date(data.timestampCalculo).getTime() : Date.now()
  const segDesdePoll = (Date.now() - baseTimestamp) / 1000
  const saldoLive = Math.round(saldoBase + (data?.interesPorSegundo ?? interesPorSegundo) * segDesdePoll)
  void tick // forzar re-render

  const depositos = (data?.depositos ?? []) as any[]

  return (
    <Backdrop initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <ModalBox
        initial={{ opacity:0, scale:.96, y:8 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:.96 }}
        onClick={e => e.stopPropagation()}
      >
        <ModalHead>
          <Wallet size={18} color={TEAL} />
          <h3>Saldo MercadoPago · histórico en tiempo real</h3>
          <span style={{ fontSize:11.5, color:tokens.gray[400] }}>
            <LiveDot /> live · refresh 5s
          </span>
          <IconBtn onClick={onClose}><X size={16} /></IconBtn>
        </ModalHead>
        <ModalBody>
          {/* Saldo grande tipo cuenta bancaria */}
          <div style={{
            padding:'22px 24px', background:'linear-gradient(135deg,#22b2b210,#22b2b205)',
            borderRadius:12, border:`1px solid ${TEAL}33`, marginBottom:18,
          }}>
            <div style={{ fontSize:11.5, color:tokens.gray[500], fontWeight:600, marginBottom:8 }}>
              SALDO ACTUAL EN MERCADOPAGO
            </div>
            <div style={{ fontSize:36, fontWeight:800, letterSpacing:'-1px', color:tokens.gray[900], lineHeight:1 }}>
              {formatCLP(saldoLive)}
            </div>
            <div style={{ marginTop:8, fontSize:12, color:tokens.gray[500] }}>
              {saldoSource === 'mp_real' ? (
                <>
                  Base oficial release_report MP del {formatFechaMP(saldoBaseFecha)}
                  · interés acumulando a +{formatCLP(Math.round((data?.interesPorSegundo ?? 0) * 86400))}/día
                </>
              ) : (
                <span style={{ color:'#f59e0b' }}>
                  Aún no hay sync con MP. El saldo mostrado es el cálculo legacy (DB).
                  Click "Sincronizar saldo real" abajo.
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:14, alignItems:'center' }}>
              <SmallBtn onClick={onSync} disabled={syncing}>
                <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Sincronizando…' : 'Sincronizar saldo real con MP'}
              </SmallBtn>
              <SmallBtn onClick={() => mutate()} style={{ background:tokens.gray[100], color:tokens.gray[700] }}>
                <RefreshCw size={13} /> Refrescar
              </SmallBtn>
              {syncStatus && (
                <span style={{ fontSize:11.5, color:tokens.gray[500] }}>{syncStatus}</span>
              )}
            </div>
          </div>

          {/* Lista de depósitos */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <ArrowDownLeft size={14} color="#10b981" />
            <span style={{ fontWeight:700, fontSize:13, color:tokens.gray[700] }}>
              Últimos {depositos.length} ingresos recibidos en MP
            </span>
          </div>
          <Table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Pagador / glosa</th>
                <th>Banco</th>
                <th style={{ textAlign:'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {depositos.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontSize:12, color:tokens.gray[500], whiteSpace:'nowrap' }}>
                    {formatFechaMP(d.fecha)}
                  </td>
                  <td>
                    <div style={{ fontSize:12.5, color:tokens.gray[700], fontWeight:600 }}>
                      {d.pagador?.nombre ?? d.descripcion ?? 'Transferencia'}
                    </div>
                    {d.descripcion && d.pagador?.nombre && (
                      <div style={{ fontSize:11, color:tokens.gray[400], marginTop:2 }}>
                        {d.descripcion}
                      </div>
                    )}
                    {d.pagador?.email && (
                      <div style={{ fontSize:10.5, color:tokens.gray[400] }}>
                        {d.pagador.email}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize:11.5, color:tokens.gray[500] }}>
                    {d.bancoOrigen ?? d.metodo ?? '—'}
                  </td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'#10b981', fontSize:13 }}>
                    +{formatCLP(d.monto)}
                  </td>
                </tr>
              ))}
              {depositos.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:30, color:tokens.gray[400] }}>
                  Sin depósitos recientes
                </td></tr>
              )}
            </tbody>
          </Table>
        </ModalBody>
      </ModalBox>
    </Backdrop>
  )
}

// ════════════════════════════════════════════════════════════════════════
// MODAL: Transferencias emitidas (gastos = MP → terceros)
// ════════════════════════════════════════════════════════════════════════
function GastosModal({ onClose }: { onClose: () => void }) {
  // Polleamos cada 10s. El cache se refresca via release_report en background.
  const { data, mutate } = useFetch<any>('/api/mercadopago/transferencias-emitidas', { refreshInterval: 10000 })
  const [resyncing, setResyncing] = useState(false)
  const [resyncMsg, setResyncMsg] = useState<string | null>(null)

  const movimientos = (data?.movimientos ?? []) as any[]

  const forzarResync = async () => {
    setResyncing(true); setResyncMsg('Pidiendo nuevo reporte a MP…')
    try {
      const post = await fetch('/api/mercadopago/fondo/sync', { method: 'POST' })
      const j = await post.json()
      if (!post.ok) { setResyncMsg(`Error: ${j.error}`); return }
      const t0 = Date.now()
      while (Date.now() - t0 < 120_000) {
        await new Promise(r => setTimeout(r, 5000))
        const g = await fetch(`/api/mercadopago/fondo/sync?taskId=${j.taskId}`)
        const gj = await g.json()
        if (gj.ready) {
          setResyncMsg(`Listo · ${gj.cantidadGastos} salidas detectadas`)
          await mutate()
          setTimeout(() => setResyncMsg(null), 4000)
          return
        }
        if (gj.status === 'failed') { setResyncMsg('MP error'); return }
      }
      setResyncMsg('Timeout')
    } finally { setResyncing(false) }
  }

  return (
    <Backdrop initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}>
      <ModalBox
        initial={{ opacity:0, scale:.96, y:8 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:.96 }}
        onClick={e => e.stopPropagation()}
      >
        <ModalHead>
          <ArrowUpRightIcon size={18} color="#ef4444" />
          <h3>Transferencias emitidas desde MercadoPago</h3>
          <span style={{ fontSize:11.5, color:tokens.gray[400] }}>
            <LiveDot /> live · refresh 10s
          </span>
          <IconBtn onClick={onClose}><X size={16} /></IconBtn>
        </ModalHead>
        <ModalBody>
          <div style={{
            padding:'18px 22px', background:'linear-gradient(135deg,#ef444410,#ef444405)',
            borderRadius:12, border:'1px solid #ef444433', marginBottom:18,
          }}>
            <div style={{ fontSize:11.5, color:tokens.gray[500], fontWeight:600, marginBottom:8 }}>
              TOTAL EMITIDO COMO TRANSFERENCIA / RETIRO (MP → tercero)
            </div>
            <div style={{ fontSize:30, fontWeight:800, color:tokens.gray[900], lineHeight:1 }}>
              {formatCLP(data?.total ?? 0)}
            </div>
            <div style={{ marginTop:8, fontSize:12, color:tokens.gray[500] }}>
              {data?.cantidad ?? 0} movimientos · sincronizado{' '}
              {data?.ultimaSincronizacion
                ? `${formatFechaMP(data.ultimaSincronizacion)} (${Math.round((data.edadCacheSegundos ?? 0) / 60)} min atrás)`
                : 'nunca'}
              {data?.stale && (
                <span style={{ color:'#f59e0b', fontWeight:600 }}> · cache stale</span>
              )}
            </div>
            <div style={{ display:'flex', gap:10, marginTop:12 }}>
              <SmallBtn onClick={forzarResync} disabled={resyncing}>
                <RefreshCw size={13} style={{ animation: resyncing ? 'spin 1s linear infinite' : 'none' }} />
                {resyncing ? 'Sincronizando…' : 'Forzar resync ahora'}
              </SmallBtn>
              {resyncMsg && <span style={{ fontSize:11.5, color:tokens.gray[500] }}>{resyncMsg}</span>}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:tokens.gray[400], lineHeight:1.5 }}>
              ⓘ MercadoPago genera el reporte oficial con un retraso de hasta 24h
              (incluye movimientos hasta las 23:59 del día anterior). Es lo más
              fresco que MP entrega como emisor de transferencias.
            </div>
          </div>

          <Table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo / glosa</th>
                <th>ID operación</th>
                <th style={{ textAlign:'right' }}>Monto</th>
                <th style={{ textAlign:'right' }}>Saldo después</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m: any, i: number) => (
                <tr key={`${m.sourceId}-${i}`}>
                  <td style={{ fontSize:12, color:tokens.gray[500], whiteSpace:'nowrap' }}>
                    {formatFechaMP(m.fecha)}
                  </td>
                  <td>
                    <div style={{ fontSize:12.5, color:tokens.gray[700], fontWeight:600 }}>
                      {m.glosa}
                    </div>
                    <div style={{ fontSize:10.5, color:tokens.gray[400], fontFamily:'monospace' }}>
                      {m.descripcion}
                    </div>
                  </td>
                  <td style={{ fontSize:11, color:tokens.gray[500], fontFamily:'monospace' }}>
                    {m.sourceId || '—'}
                  </td>
                  <td style={{ textAlign:'right', fontWeight:700, color:'#ef4444', fontSize:13 }}>
                    −{formatCLP(m.monto)}
                  </td>
                  <td style={{ textAlign:'right', fontSize:11.5, color:tokens.gray[500] }}>
                    {formatCLP(m.saldoDespues)}
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:30, color:tokens.gray[400] }}>
                  {data?.ultimaSincronizacion
                    ? 'Sin transferencias emitidas en el período'
                    : 'Sin sincronizar. Click "Forzar resync ahora".'}
                </td></tr>
              )}
            </tbody>
          </Table>
        </ModalBody>
      </ModalBox>
    </Backdrop>
  )
}

