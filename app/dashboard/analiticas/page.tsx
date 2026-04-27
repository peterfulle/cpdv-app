'use client'

import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ComposedChart, Line,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, BarChart2,
  PieChart as PieIcon, AlertTriangle, CreditCard, ShoppingBag,
  Target, Calendar, DollarSign, Wallet, Activity,
} from 'lucide-react'
import { tokens } from '@/styles/theme'
import { formatCLP } from '@/lib/utils'
import { useFetch } from '@/lib/useFetch'

const TEAL = '#22b2b2'

// ── Styles ────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px 36px;
  max-width: 1360px;
  @media (max-width: 768px) { padding: 16px; }
`

const PageHeader = styled.div`
  margin-bottom: 24px;
  h1 { font-size: 20px; font-weight: 700; color: ${tokens.gray[900]}; letter-spacing: -.3px; }
  p  { font-size: 13px; color: ${tokens.gray[400]}; margin-top: 3px; }
`

const SectionTitle = styled.h2`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .8px;
  color: ${tokens.gray[400]};
  margin: 28px 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${tokens.gray[100]};
    margin-left: 4px;
  }
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

const Grid4 = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px)  { grid-template-columns: 1fr; }
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

const KPILabel = styled.div`
  font-size: 12px;
  color: ${tokens.gray[400]};
  font-weight: 500;
`

const KPIValue = styled.div<{ color?: string }>`
  font-size: 24px;
  font-weight: 800;
  color: ${p => p.color ?? tokens.gray[900]};
  letter-spacing: -.5px;
  line-height: 1;
  margin-bottom: 4px;
`

const KPISub = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  font-size: 11px;
  color: ${tokens.gray[400]};
`

const ChartCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  h3 { font-size: 13.5px; font-weight: 700; color: ${tokens.gray[700]}; flex: 1; }
  .sub { font-size: 11px; color: ${tokens.gray[400]}; }
`

const ChartIconWrap = styled.div`
  width: 28px; height: 28px; border-radius: 7px;
  background: ${tokens.gray[50]}; color: ${tokens.gray[400]};
  display: flex; align-items: center; justify-content: center;
`

const CuotaBar = styled.div`
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
`
const CuotaLabel = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  font-size: 12px; margin-bottom: 4px;
  span { color: ${tokens.gray[700]}; font-weight: 600; }
  strong { color: ${tokens.gray[400]}; font-weight: 500; }
`
const CuotaProgBar = styled.div`
  height: 6px; background: ${tokens.gray[100]}; border-radius: 99px; overflow: hidden;
  div { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.16,1,.3,1); }
`

const DeudaRow = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid ${tokens.gray[50]};
  &:last-child { border-bottom: none; }
`
const DeudaRank = styled.span`
  font-size: 11px; font-weight: 800; color: ${tokens.gray[300]}; min-width: 20px;
`
const DeudaName = styled.span`
  flex: 1; font-size: 13px; font-weight: 600; color: ${tokens.gray[700]};
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`
const DeudaBar = styled.div`
  display: flex; align-items: center; gap: 8px;
  div { height: 5px; border-radius: 99px; background: #fb7185; }
`

const Skeleton = styled.div`
  background: linear-gradient(90deg, ${tokens.gray[100]} 25%, ${tokens.gray[200]} 50%, ${tokens.gray[100]} 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12px;
  @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
`

const TooltipBox = styled.div`
  background: #fff; border: 1px solid ${tokens.gray[100]};
  border-radius: 10px; padding: 10px 14px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  font-size: 12.5px;
`

const StatRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid ${tokens.gray[50]};
  &:last-child { border-bottom: none; }
  .label { font-size: 12.5px; color: ${tokens.gray[500]}; }
  .val   { font-size: 13.5px; font-weight: 700; color: ${tokens.gray[800]}; }
`

// ── Tooltips ──────────────────────────────────────────────────────────
const MoneyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <TooltipBox>
      <div style={{ fontWeight: 700, marginBottom: 4, color: tokens.gray[700] }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ color: entry.color, display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
          <span style={{ color: tokens.gray[600] }}>{entry.name}:</span>
          <strong style={{ color: tokens.gray[800] }}>{formatCLP(entry.value)}</strong>
        </div>
      ))}
    </TooltipBox>
  )
}

// ── Component ─────────────────────────────────────────────────────────
export default function AnaliticasPage() {
  const { data, isLoading } = useFetch<any>('/api/otros-ingresos', { refreshInterval: 60000 })

  if (isLoading) {
    return (
      <Page>
        <PageHeader>
          <h1>Analíticas</h1>
          <p>Cargando datos...</p>
        </PageHeader>
        <Grid4>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 120 }} />)}
        </Grid4>
        <Skeleton style={{ height: 320, marginBottom: 14 }} />
        <Grid2>
          <Skeleton style={{ height: 280 }} />
          <Skeleton style={{ height: 280 }} />
        </Grid2>
      </Page>
    )
  }

  if (!data) return null

  const {
    kpisAvanzados = {},
    paymentTrend = [],
    monthlyTrend = [],
    topAlumnos   = [],
    cuotaStats   = [],
    alumnosDebt  = [],
    incomeBreakdown = [],
    paymentMethods  = [],
    polerSizes      = [],
    paymentsByDow   = [],
    topGastos       = [],
    mpFondo,
    resumenFinanciero = {},
  } = data

  const { totalIngresos = 0, totalGastos = 0 } = resumenFinanciero
  const saldo = totalIngresos - totalGastos
  const maxDeuda = alumnosDebt[0]?.pendiente ?? 1
  const radarData = cuotaStats.slice(0, 8).map((c: any) => ({
    name: c.nombre.replace('Cuota ', 'C').replace('Mensualidad ', 'M'),
    porcentaje: c.porcentaje,
  }))

  // Format month label
  const fmtMes = (m: string) => {
    const [y, mm] = m.split('-')
    const mes = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][parseInt(mm) - 1]
    return `${mes} ${y.slice(2)}`
  }
  const monthlyTrendFmt = monthlyTrend.map((m: any) => ({ ...m, mesLabel: fmtMes(m.mes) }))

  const totalPagosMP   = paymentMethods.find((p: any) => p.name === 'MercadoPago')?.amount ?? 0
  const totalEfectivo  = paymentMethods.find((p: any) => p.name === 'Efectivo')?.amount ?? 0

  return (
    <Page>
      <PageHeader>
        <h1>Tesorería · Analíticas</h1>
        <p>Vista 360° del estado financiero del curso · datos en vivo</p>
      </PageHeader>

      {/* ═══ FINANZAS GLOBALES ═══════════════════════════════════════ */}
      <SectionTitle><DollarSign size={13} />Finanzas globales</SectionTitle>
      <Grid4>
        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
          <KPIIcon><TrendingUp size={14} /></KPIIcon>
          <KPIValue color="#059669">{formatCLP(totalIngresos)}</KPIValue>
          <KPILabel>Total ingresos</KPILabel>
          <KPISub>{kpisAvanzados.cantidadPagos} pagos + otros</KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <KPIIcon><TrendingDown size={14} /></KPIIcon>
          <KPIValue color="#be123c">{formatCLP(totalGastos)}</KPIValue>
          <KPILabel>Total gastos</KPILabel>
          <KPISub>
            {totalIngresos > 0 ? `${Math.round((totalGastos/totalIngresos)*100)}% de los ingresos` : '—'}
          </KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}>
          <KPIIcon><Wallet size={14} /></KPIIcon>
          <KPIValue color={saldo >= 0 ? tokens.gray[900] : '#be123c'}>{formatCLP(saldo)}</KPIValue>
          <KPILabel>Saldo neto contable</KPILabel>
          <KPISub>DB local · ingresos − gastos</KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.12 }}>
          <KPIIcon><Activity size={14} /></KPIIcon>
          {mpFondo ? (
            <>
              <KPIValue color="#0891b2">{formatCLP(mpFondo.saldoActual)}</KPIValue>
              <KPILabel>Saldo bancario MP</KPILabel>
              <KPISub>+{formatCLP(mpFondo.interesAbonado)} interés · TNA {mpFondo.tasaAnualPct}%</KPISub>
            </>
          ) : (
            <>
              <KPIValue color={tokens.gray[400]}>—</KPIValue>
              <KPILabel>Saldo bancario MP</KPILabel>
              <KPISub>Sincroniza el fondo MP</KPISub>
            </>
          )}
        </KPICard>
      </Grid4>

      {/* ═══ KPIs OPERATIVOS ════════════════════════════════════════ */}
      <SectionTitle><Target size={13} />Operación y comportamiento</SectionTitle>
      <Grid4>
        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
          <KPIIcon><Users size={14} /></KPIIcon>
          <KPIValue>{kpisAvanzados.conversionPct}%</KPIValue>
          <KPILabel>Conversión</KPILabel>
          <KPISub>{kpisAvanzados.alumnosConPago} de {kpisAvanzados.totalAlumnos} alumnos pagaron</KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <KPIIcon><AlertTriangle size={14} /></KPIIcon>
          <KPIValue color={kpisAvanzados.morosidadPct > 30 ? '#be123c' : tokens.gray[900]}>
            {kpisAvanzados.morosidadPct}%
          </KPIValue>
          <KPILabel>Tasa de morosidad</KPILabel>
          <KPISub>alumnos con pendiente {'>'} 0</KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}>
          <KPIIcon><CreditCard size={14} /></KPIIcon>
          <KPIValue>{formatCLP(kpisAvanzados.ticketPromedio)}</KPIValue>
          <KPILabel>Ticket promedio</KPILabel>
          <KPISub>{kpisAvanzados.pagosPorAlumnoAvg} pagos/alumno</KPISub>
        </KPICard>

        <KPICard initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.12 }}>
          <KPIIcon><BarChart2 size={14} /></KPIIcon>
          <KPIValue>{kpisAvanzados.concentracionTop5Pct}%</KPIValue>
          <KPILabel>Concentración top 5</KPILabel>
          <KPISub>{formatCLP(kpisAvanzados.top5Total)} de los 5 que más aportan</KPISub>
        </KPICard>
      </Grid4>

      {/* ═══ EVOLUCIÓN ══════════════════════════════════════════════ */}
      <SectionTitle><Calendar size={13} />Evolución temporal</SectionTitle>

      {/* Monthly bars: ingresos (stacked) vs gastos */}
      {monthlyTrendFmt.length > 0 && (
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom: 14 }}>
          <ChartHeader>
            <ChartIconWrap><BarChart2 size={14} /></ChartIconWrap>
            <h3>Ingresos vs gastos por mes</h3>
            <span className="sub">últimos {monthlyTrendFmt.length} meses</span>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthlyTrendFmt}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 11, fill: tokens.gray[400] }} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: tokens.gray[400] }} tickLine={false} axisLine={false} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="cuotas"  stackId="a" fill={TEAL}     name="Cuotas"    radius={[0,0,0,0]} />
              <Bar dataKey="poleron" stackId="a" fill="#94a3b8"  name="Polerones" radius={[0,0,0,0]} />
              <Bar dataKey="otros"   stackId="a" fill="#cbd5e1"  name="Otros"     radius={[4,4,0,0]} />
              <Bar dataKey="gastos"  fill="#fb7185"              name="Gastos"    radius={[4,4,0,0]} />
              <Line type="monotone" dataKey="neto" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Neto" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Daily trend */}
      {paymentTrend.length > 0 && (
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom: 14 }}>
          <ChartHeader>
            <ChartIconWrap><TrendingUp size={14} /></ChartIconWrap>
            <h3>Tendencia diaria de ingresos (pagos)</h3>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={paymentTrend}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={.2} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} />
              <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: tokens.gray[400] }} tickLine={false} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: tokens.gray[400] }} tickLine={false} axisLine={false} />
              <Tooltip content={<MoneyTooltip />} />
              <Area type="monotone" dataKey="monto" stroke={TEAL} fill="url(#areaGrad)" strokeWidth={1.5} name="Ingresos" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* ═══ COMPOSICIÓN ════════════════════════════════════════════ */}
      <SectionTitle><PieIcon size={13} />Composición y distribución</SectionTitle>
      <Grid3>
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
          <ChartHeader>
            <ChartIconWrap><PieIcon size={14} /></ChartIconWrap>
            <h3>Composición ingresos</h3>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={incomeBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}>
                {incomeBreakdown.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => formatCLP(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <ChartHeader>
            <ChartIconWrap><CreditCard size={14} /></ChartIconWrap>
            <h3>Método de pago</h3>
          </ChartHeader>
          {totalPagosMP + totalEfectivo > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  paddingAngle={3} dataKey="amount"
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {paymentMethods.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCLP(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 0', color: tokens.gray[400], fontSize: 12 }}>
              Sin pagos registrados aún
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-around', marginTop: 8, fontSize: 11, color: tokens.gray[500] }}>
            <span>MP: {paymentMethods[0]?.count ?? 0} pagos</span>
            <span>Efectivo: {paymentMethods[1]?.count ?? 0} pagos</span>
          </div>
        </ChartCard>

        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}>
          <ChartHeader>
            <ChartIconWrap><ShoppingBag size={14} /></ChartIconWrap>
            <h3>Polerones por talla</h3>
          </ChartHeader>
          {polerSizes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={polerSizes}>
                <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: tokens.gray[500] }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tokens.gray[400] }} tickLine={false} axisLine={false} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="cantidad" fill="#94a3b8" name="Cantidad" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 0', color: tokens.gray[400], fontSize: 12 }}>
              Sin elecciones registradas
            </div>
          )}
        </ChartCard>
      </Grid3>

      {/* ═══ ALUMNOS ═════════════════════════════════════════════════ */}
      <SectionTitle><Users size={13} />Alumnos</SectionTitle>
      <Grid2>
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
          <ChartHeader>
            <ChartIconWrap><Users size={14} /></ChartIconWrap>
            <h3>Top estudiantes por aporte</h3>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topAlumnos.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} horizontal={false} />
              <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: tokens.gray[400] }} tickLine={false} />
              <YAxis type="category" dataKey="nombre" width={110}
                tick={{ fontSize: 10, fill: tokens.gray[600] }} tickLine={false}
                tickFormatter={(v: string) => v.split(' ').slice(0, 2).join(' ').slice(0, 16)} />
              <Tooltip formatter={(v: any) => formatCLP(Number(v))} />
              <Bar dataKey="total" fill={TEAL} radius={[0, 4, 4, 0]} name="Total aportado" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <ChartHeader>
            <ChartIconWrap><AlertTriangle size={14} /></ChartIconWrap>
            <h3>Estudiantes con mayor deuda</h3>
          </ChartHeader>
          <div>
            {alumnosDebt.filter((a: any) => a.pendiente > 0).slice(0, 10).map((a: any, i: number) => (
              <DeudaRow key={a.id}>
                <DeudaRank>#{i + 1}</DeudaRank>
                <DeudaName>{a.nombre.split(',')[0]}</DeudaName>
                <DeudaBar><div style={{ width: Math.max(40, (a.pendiente / maxDeuda) * 120) }} /></DeudaBar>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: tokens.gray[700], minWidth: 80, textAlign: 'right' }}>
                  {formatCLP(a.pendiente)}
                </span>
              </DeudaRow>
            ))}
            {alumnosDebt.filter((a: any) => a.pendiente > 0).length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: tokens.gray[400] }}>
                <TrendingUp size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: .3 }} />
                <p style={{ fontSize: 13 }}>¡Todos los estudiantes están al día!</p>
              </div>
            )}
          </div>
        </ChartCard>
      </Grid2>

      {/* ═══ CUOTAS ══════════════════════════════════════════════════ */}
      <SectionTitle><Target size={13} />Cobertura de cuotas</SectionTitle>
      <Grid2>
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
          <ChartHeader>
            <ChartIconWrap><BarChart2 size={14} /></ChartIconWrap>
            <h3>Cobertura por cuota</h3>
          </ChartHeader>
          <div>
            {cuotaStats.slice(0, 12).map((c: any) => (
              <CuotaBar key={c.nombre}>
                <CuotaLabel>
                  <span>{c.nombre}</span>
                  <strong>{c.alumnosPagaron}/{c.totalAlumnos} · {c.porcentaje}%</strong>
                </CuotaLabel>
                <CuotaProgBar>
                  <div style={{
                    width: `${c.porcentaje}%`,
                    background: c.porcentaje >= 80 ? '#10b981'
                      : c.porcentaje >= 40 ? '#f59e0b'
                      : '#fb7185'
                  }} />
                </CuotaProgBar>
              </CuotaBar>
            ))}
          </div>
        </ChartCard>

        {radarData.length > 2 && (
          <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
            <ChartHeader>
              <ChartIconWrap><Activity size={14} /></ChartIconWrap>
              <h3>Radar de cobertura</h3>
            </ChartHeader>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={tokens.gray[100]} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: tokens.gray[500] }} />
                <Radar name="Cobertura %" dataKey="porcentaje" stroke={TEAL} fill={TEAL} fillOpacity={0.18} strokeWidth={1.5} />
                <Tooltip formatter={(v: any) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </Grid2>

      {/* ═══ PATRONES ════════════════════════════════════════════════ */}
      <SectionTitle><Activity size={13} />Patrones de pago</SectionTitle>
      <Grid2>
        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
          <ChartHeader>
            <ChartIconWrap><Calendar size={14} /></ChartIconWrap>
            <h3>Pagos por día de la semana</h3>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={paymentsByDow}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.gray[100]} />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fill: tokens.gray[500] }} tickLine={false}
                tickFormatter={(d: string) => d.slice(0, 3)} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: tokens.gray[400] }} tickLine={false} axisLine={false} />
              <Tooltip content={<MoneyTooltip />} />
              <Bar dataKey="monto" fill={TEAL} name="Monto recaudado" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <ChartHeader>
            <ChartIconWrap><TrendingDown size={14} /></ChartIconWrap>
            <h3>Top gastos</h3>
          </ChartHeader>
          {topGastos.length > 0 ? (
            <div>
              {topGastos.map((g: any, i: number) => (
                <StatRow key={i}>
                  <span className="label">
                    <span style={{ color: tokens.gray[300], fontWeight: 800, marginRight: 8 }}>#{i+1}</span>
                    {g.nombre}
                  </span>
                  <span className="val" style={{ color: '#be123c' }}>{formatCLP(g.monto)}</span>
                </StatRow>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'40px 0', color: tokens.gray[400], fontSize: 12 }}>
              Sin gastos registrados
            </div>
          )}
        </ChartCard>
      </Grid2>

      {/* ═══ FONDO MP ════════════════════════════════════════════════ */}
      {mpFondo && (
        <>
          <SectionTitle><Wallet size={13} />Cuenta bancaria MercadoPago</SectionTitle>
          <ChartCard initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
            <ChartHeader>
              <ChartIconWrap><Wallet size={14} /></ChartIconWrap>
              <h3>Estado del fondo</h3>
              <span className="sub">
                {mpFondo.ultimaSincronizacion
                  ? `sincronizado ${new Date(mpFondo.ultimaSincronizacion).toLocaleString('es-CL')}`
                  : '—'}
              </span>
            </ChartHeader>
            <Grid4>
              <div>
                <KPILabel>Saldo real (sync)</KPILabel>
                <KPIValue color="#0891b2">{formatCLP(mpFondo.saldoReal)}</KPIValue>
                <KPISub>desde release_report</KPISub>
              </div>
              <div>
                <KPILabel>Saldo actual estimado</KPILabel>
                <KPIValue>{formatCLP(mpFondo.saldoActual)}</KPIValue>
                <KPISub>+{formatCLP(mpFondo.interesExtrapolado)} interés extrapolado</KPISub>
              </div>
              <div>
                <KPILabel>Interés abonado por MP</KPILabel>
                <KPIValue color="#059669">{formatCLP(mpFondo.interesAbonado)}</KPIValue>
                <KPISub>asset_management acumulado</KPISub>
              </div>
              <div>
                <KPILabel>Tasa anual</KPILabel>
                <KPIValue>{mpFondo.tasaAnualPct}%</KPIValue>
                <KPISub>cuenta remunerada MP Chile</KPISub>
              </div>
            </Grid4>
          </ChartCard>
        </>
      )}
    </Page>
  )
}
