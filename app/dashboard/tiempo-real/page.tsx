'use client'

import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
// ── Inline SVG icons ─────────────────────────────────────────────────
type SvgProps = { size?: number; color?: string; style?: React.CSSProperties }

const IcoCheck = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
  </svg>
)
const IcoWarn = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r=".5" fill={color}/>
  </svg>
)
const IcoXCircle = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
)
const IcoShield = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
)
const IcoZap = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IcoClock = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoRefresh = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)
const IcoUsers = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcoCalendar = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>
  </svg>
)
const IcoTarget = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IcoChevronDown = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const IcoChevronUp = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)
import { useState } from 'react'
import { tokens } from '@/styles/theme'
import { formatCLP } from '@/lib/utils'

const TEAL = '#22b2b2'

// ── Types ─────────────────────────────────────────────────────────────
interface AlumnoRT {
  id: number
  nombre: string
  talla: string
  montoCuotasPagado: number
  montoCuotasEsperadas: number
  montoCuotasMeta: number
  cuotasPagadas: string[]
  cuotasAtrasadas: string[]
  cuotasFaltantes: string[]
  cuotasAdelantadas: string[]
  statusCuotas: 'al_dia' | 'atrasado' | 'adelantado'
  montoPoleroPagado: number
  montoPoleroMeta: number
  poleronAlDia: boolean
  porcCuotasVsMeta: number
  porcCuotasVsEsperado: number
  porcPoleron: number
}

interface TiempoRealData {
  generadoEn: string
  mesActual: number
  cuotasDebidasHastahoy: string[]
  cuotasPendientes: string[]
  global: {
    totalAlumnos: number
    alDia: number
    adelantados: number
    atrasados: number
    poleronCompleto: number
    porcGlobalCuotasVsEsperado: number
    porcGlobalCuotasVsMeta: number
    porcGlobalPoleron: number
    totalRecCuotas: number
    totalEsperadoCuotas: number
    totalMetaCuotas: number
    totalRecPoleron: number
    totalMetaPoleron: number
    proyeccionAnual: number
    deficit: number
  }
  alumnos: AlumnoRT[]
}

// ── Styled ─────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px 36px;
  min-height: 100vh;
  @media (max-width: 768px) { padding: 16px; }
`

const PageHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

const HeaderLeft = styled.div`
  h1 {
    font-size: 20px;
    font-weight: 700;
    color: ${tokens.gray[900]};
    letter-spacing: -.3px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  p { font-size: 13px; color: ${tokens.gray[400]}; margin-top: 3px; }
`

const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .5px;
  color: #059669;
  background: rgba(16,185,129,.1);
  border: 1px solid rgba(16,185,129,.25);
  border-radius: 20px;
  padding: 3px 10px;
  text-transform: uppercase;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    animation: pulse 1.6s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .5; transform: scale(.85); }
  }
`

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px solid ${tokens.gray[200]};
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.gray[600]};
  cursor: pointer;
  transition: all .15s;
  &:hover { background: ${tokens.gray[50]}; border-color: ${tokens.gray[300]}; }
`

const UpdatedAt = styled.span`
  font-size: 11px;
  color: ${tokens.gray[400]};
  display: flex;
  align-items: center;
  gap: 4px;
`

/* Health banner - clean dashboard-style card */
const HealthBanner = styled(motion.div)<{ $health: 'great' | 'ok' | 'warning' | 'critical' }>`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-left: 3px solid;
  border-radius: 14px;
  padding: 18px 22px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);

  ${p => p.$health === 'great'    && `border-left-color: #10b981;`}
  ${p => p.$health === 'ok'       && `border-left-color: ${TEAL};`}
  ${p => p.$health === 'warning'  && `border-left-color: #f59e0b;`}
  ${p => p.$health === 'critical' && `border-left-color: #fb7185;`}
`

const HealthIcon = styled.div<{ $health: 'great' | 'ok' | 'warning' | 'critical' }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${p => p.$health === 'great'    && `background: rgba(16,185,129,.10); color: #059669;`}
  ${p => p.$health === 'ok'       && `background: rgba(34,178,178,.10); color: ${TEAL};`}
  ${p => p.$health === 'warning'  && `background: rgba(245,158,11,.12); color: #d97706;`}
  ${p => p.$health === 'critical' && `background: rgba(251,113,133,.12); color: #be123c;`}
`

const HealthText = styled.div`
  flex: 1;
  h3 { font-size: 14px; font-weight: 700; color: ${tokens.gray[800]}; }
  p  { font-size: 12.5px; color: ${tokens.gray[500]}; margin-top: 2px; }
`

const HealthStat = styled.div`
  text-align: right;
  flex-shrink: 0;
  strong { font-size: 22px; font-weight: 800; color: ${tokens.gray[900]}; letter-spacing: -.5px; }
  span   { font-size: 11px; color: ${tokens.gray[400]}; display: block; margin-top: 2px; }
`

/* KPI grid - dashboard-style */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
`

const KpiCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`

const KpiIcon = styled.div`
  margin-bottom: 10px;
  color: ${tokens.gray[300]};
`

const KpiLabel = styled.p`
  font-size: 12px;
  color: ${tokens.gray[400]};
  font-weight: 500;
`

const KpiValue = styled.div<{ $color?: string }>`
  font-size: 26px;
  font-weight: 800;
  color: ${p => p.$color ?? tokens.gray[900]};
  letter-spacing: -.5px;
  line-height: 1;
  margin-bottom: 4px;
`

const KpiSub = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 500;
  color: ${tokens.gray[400]};
`

/* Progress bar */
const BarTrack = styled.div`
  height: 6px;
  border-radius: 99px;
  background: ${tokens.gray[100]};
  overflow: hidden;
  margin-top: 10px;
`

const BarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${p => Math.min(p.$pct, 100)}%;
  background: ${p => p.$color};
  border-radius: 99px;
  transition: width .6s ease;
`

/* Summary bars row */
const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`

const SummaryCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
`

const SummaryTitle = styled.h3`
  font-size: 13.5px;
  font-weight: 700;
  color: ${tokens.gray[700]};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 7px;
`

const MoneyRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`

const MoneyLabel = styled.span`
  font-size: 12.5px;
  color: ${tokens.gray[500]};
`

const MoneyVal = styled.span<{ $bold?: boolean; $color?: string }>`
  font-size: ${p => p.$bold ? '15px' : '13px'};
  font-weight: ${p => p.$bold ? '800' : '600'};
  color: ${p => p.$color ?? tokens.gray[800]};
`

/* Tabla alumnos */
const TableWrap = styled.div`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
`

const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid ${tokens.gray[100]};
  gap: 12px;
  flex-wrap: wrap;
`

const TableTitle = styled.h3`
  font-size: 13.5px;
  font-weight: 700;
  color: ${tokens.gray[700]};
  display: flex;
  align-items: center;
  gap: 8px;
`

const FilterGroup = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

const FilterBtn = styled.button<{ $active: boolean; $color?: string }>`
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid;
  transition: all .15s;
  border-color: ${p => p.$active ? (p.$color ?? TEAL) : tokens.gray[200]};
  background: ${p => p.$active ? (p.$color ? `${p.$color}18` : `${TEAL}14`) : '#fff'};
  color: ${p => p.$active ? (p.$color ?? TEAL) : tokens.gray[500]};
  &:hover { border-color: ${p => p.$color ?? TEAL}; }
`

const AlumnoRow = styled(motion.div)<{ $status: string }>`
  border-bottom: 1px solid ${tokens.gray[50]};
  &:last-child { border-bottom: none; }
`

const AlumnoMain = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 20px;
  gap: 14px;
  cursor: pointer;
  transition: background .12s;
  &:hover { background: ${tokens.gray[50]}; }
`

const AlumnoIdx = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${tokens.gray[300]};
  width: 18px;
  flex-shrink: 0;
  text-align: right;
`

const AlumnoAvatar = styled.div<{ $status: string }>`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
  ${p => p.$status === 'adelantado' && `background: rgba(16,185,129,.12); color: #065f46;`}
  ${p => p.$status === 'al_dia'     && `background: rgba(34,178,178,.12); color: #0e7070;`}
  ${p => p.$status === 'atrasado'   && `background: rgba(251,113,133,.12); color: #9f1239;`}
`

const AlumnoInfo = styled.div`
  flex: 1;
  min-width: 0;
  p:first-of-type { font-size: 13.5px; font-weight: 600; color: ${tokens.gray[800]}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  p:last-of-type  { font-size: 11px; color: ${tokens.gray[400]}; margin-top: 2px; }
`

const AlumnoBars = styled.div`
  flex: 0 0 200px;
  @media (max-width: 700px) { display: none; }
`

const MiniBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`

const MiniBarLabel = styled.span`
  font-size: 10px;
  color: ${tokens.gray[400]};
  width: 50px;
  flex-shrink: 0;
`

const MiniBarTrack = styled.div`
  flex: 1;
  height: 5px;
  border-radius: 99px;
  background: ${tokens.gray[100]};
  overflow: hidden;
`

const MiniBarFill = styled.div<{ $pct: number; $color: string }>`
  height: 100%;
  width: ${p => Math.min(p.$pct, 100)}%;
  background: ${p => p.$color};
  border-radius: 99px;
`

const MiniBarPct = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: ${tokens.gray[500]};
  width: 28px;
  text-align: right;
  flex-shrink: 0;
`

const StatusPill = styled.div<{ $status: string }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  ${p => p.$status === 'adelantado' && `background:rgba(16,185,129,.12); color:#065f46; border:1px solid rgba(16,185,129,.25);`}
  ${p => p.$status === 'al_dia'     && `background:rgba(34,178,178,.1); color:#0e7070; border:1px solid rgba(34,178,178,.2);`}
  ${p => p.$status === 'atrasado'   && `background:rgba(251,113,133,.1); color:#be123c; border:1px solid rgba(251,113,133,.25);`}
`

const PoleronDot = styled.span<{ $ok: boolean }>`
  width: 8px; height: 8px;
  border-radius: 50%;
  background: ${p => p.$ok ? '#10b981' : tokens.gray[300]};
  display: inline-block;
  flex-shrink: 0;
`

const ExpandedDetail = styled(motion.div)`
  border-top: 1px solid ${tokens.gray[100]};
  padding: 14px 20px 16px 72px;
  background: ${tokens.gray[50]};
  @media (max-width: 600px) { padding-left: 16px; }
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 6px;
`

const Tag = styled.span<{ $variant: 'ok' | 'warn' | 'falta' | 'adelanto' }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  ${p => p.$variant === 'ok'      && `background:rgba(16,185,129,.12); color:#065f46;`}
  ${p => p.$variant === 'warn'    && `background:rgba(251,113,133,.1); color:#be123c;`}
  ${p => p.$variant === 'falta'   && `background:rgba(156,163,175,.1); color:${tokens.gray[500]};`}
  ${p => p.$variant === 'adelanto' && `background:rgba(34,178,178,.1); color:#0e7070;`}
`

const DetailLabel = styled.p`
  font-size: 11.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: ${tokens.gray[400]};
  margin-top: 10px;
  &:first-of-type { margin-top: 0; }
`

// ── Helpers ───────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(' ').filter(n => n.length > 1).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function statusColor(s: string) {
  if (s === 'adelantado') return '#10b981'
  if (s === 'al_dia')     return TEAL
  return '#fb7185'
}

function statusLabel(s: string) {
  if (s === 'adelantado') return 'Adelantado'
  if (s === 'al_dia')     return 'Al día'
  return 'Atrasado'
}

function statusIcon(s: string) {
  if (s === 'adelantado') return <IcoCheck size={11} />
  if (s === 'al_dia')     return <IcoCheck size={11} />
  return <IcoWarn size={11} />
}

function healthLevel(pct: number): 'great' | 'ok' | 'warning' | 'critical' {
  if (pct >= 90) return 'great'
  if (pct >= 70) return 'ok'
  if (pct >= 40) return 'warning'
  return 'critical'
}

function healthMsg(pct: number, atrasados: number) {
  if (pct >= 90) return { title: '¡Excelente recaudación!', sub: `La clase va muy bien. Solo ${atrasados} alumno${atrasados !== 1?'s':''} con pagos pendientes.` }
  if (pct >= 70) return { title: 'Recaudación en buen camino', sub: `Vamos bien, aunque ${atrasados} alumno${atrasados !== 1?'s':''} deben ponerse al día.` }
  if (pct >= 40) return { title: 'Atención: recaudación baja', sub: `${atrasados} alumnos atrasados. Conviene enviar un recordatorio.` }
  return { title: 'Recaudación crítica', sub: `Gran parte del curso está atrasado. Se recomienda acción inmediata.` }
}

// ── Component ─────────────────────────────────────────────────────────
export default function TiempoRealPage() {
  const { data, isLoading, error, mutate } = useFetch<TiempoRealData>(
    '/api/tiempo-real',
    { refreshInterval: 30_000 }
  )
  const [filter, setFilter] = useState<'todos' | 'atrasado' | 'al_dia' | 'adelantado'>('todos')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (isLoading) return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10, color: tokens.gray[400] }}>
        <IcoRefresh size={18} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Cargando estado en tiempo real…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </Page>
  )

  if (error || !data) return (
    <Page>
      <div style={{ textAlign: 'center', padding: 60, color: tokens.rose[500] }}>
        <IcoXCircle size={32} style={{ margin: '0 auto 12px' }} />
        <p>Error cargando datos</p>
      </div>
    </Page>
  )

  const { global: g, alumnos, cuotasDebidasHastahoy, cuotasPendientes } = data
  const health  = healthLevel(g.porcGlobalCuotasVsEsperado)
  const msg     = healthMsg(g.porcGlobalCuotasVsEsperado, g.atrasados)
  const updatedAt = new Date(data.generadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const alumnosFiltrados = filter === 'todos'
    ? alumnos
    : alumnos.filter(a => a.statusCuotas === filter)

  const healthIconEl = health === 'great' || health === 'ok'
    ? <IcoShield size={22} />
    : health === 'warning' ? <IcoWarn size={22} /> : <IcoXCircle size={22} />

  return (
    <Page>
      {/* Header */}
      <PageHeader>
        <HeaderLeft>
          <h1>
            <IcoZap size={20} color={TEAL} />
            Tesorería · Tiempo Real
            <LiveBadge>En vivo</LiveBadge>
          </h1>
          <p>Recaudación por alumno vs metas · actualizado automáticamente cada 30 seg</p>
        </HeaderLeft>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <UpdatedAt><IcoClock size={12} /> {updatedAt}</UpdatedAt>
          <RefreshBtn onClick={mutate}>
            <IcoRefresh size={13} />
            Actualizar
          </RefreshBtn>
        </div>
      </PageHeader>

      {/* Health Banner */}
      <HealthBanner
        $health={health}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .3 }}
      >
        <HealthIcon $health={health}>{healthIconEl}</HealthIcon>
        <HealthText>
          <h3>{msg.title}</h3>
          <p>{msg.sub}</p>
        </HealthText>
        <HealthStat>
          <strong>{g.porcGlobalCuotasVsEsperado}%</strong>
          <span>del objetivo a la fecha</span>
        </HealthStat>
      </HealthBanner>

      {/* KPI Row */}
      <KpiGrid>
        <KpiCard
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
        >
          <KpiIcon><IcoCheck size={14} /></KpiIcon>
          <KpiValue $color="#059669">{g.alDia + g.adelantados}</KpiValue>
          <KpiLabel>Al día / adelantados</KpiLabel>
          <KpiSub>de {g.totalAlumnos} alumnos · {g.adelantados} adelantados</KpiSub>
        </KpiCard>

        <KpiCard
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
        >
          <KpiIcon><IcoWarn size={14} /></KpiIcon>
          <KpiValue $color="#be123c">{g.atrasados}</KpiValue>
          <KpiLabel>Con atraso</KpiLabel>
          <KpiSub>de {g.totalAlumnos} alumnos atrasados</KpiSub>
        </KpiCard>

        <KpiCard
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
        >
          <KpiIcon><IcoTarget size={14} /></KpiIcon>
          <KpiValue>{g.porcGlobalCuotasVsMeta}%</KpiValue>
          <KpiLabel>Cuotas recaudadas (anual)</KpiLabel>
          <KpiSub>{g.porcGlobalCuotasVsEsperado}% vs esperado a hoy</KpiSub>
        </KpiCard>

        <KpiCard
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
        >
          <KpiIcon><IcoUsers size={14} /></KpiIcon>
          <KpiValue>{g.poleronCompleto}</KpiValue>
          <KpiLabel>Polerones pagados</KpiLabel>
          <KpiSub>de {g.totalAlumnos} alumnos · {g.porcGlobalPoleron}% recaudado</KpiSub>
        </KpiCard>
      </KpiGrid>

      {/* Summary cards */}
      <SummaryRow>
        {/* Cuotas summary */}
        <SummaryCard
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}
        >
          <SummaryTitle>
            <IcoCalendar size={15} color={TEAL} />
            Resumen Cuotas — {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </SummaryTitle>

          <MoneyRow>
            <MoneyLabel>Meses vencidos</MoneyLabel>
            <MoneyVal>{cuotasDebidasHastahoy.join(', ')}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Pendientes</MoneyLabel>
            <MoneyVal $color={tokens.gray[400]}>{cuotasPendientes.length > 0 ? cuotasPendientes.join(', ') : 'Ninguno'}</MoneyVal>
          </MoneyRow>

          <div style={{ height: 1, background: tokens.gray[100], margin: '12px 0' }} />

          <MoneyRow>
            <MoneyLabel>Meta acumulada a hoy</MoneyLabel>
            <MoneyVal>{formatCLP(g.totalEsperadoCuotas)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Recaudado</MoneyLabel>
            <MoneyVal $color="#059669" $bold>{formatCLP(g.totalRecCuotas)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Déficit actual</MoneyLabel>
            <MoneyVal $color={g.deficit > 0 ? '#be123c' : '#059669'}>
              {g.deficit > 0 ? '-' : '+'}{formatCLP(Math.abs(g.deficit))}
            </MoneyVal>
          </MoneyRow>

          <BarTrack style={{ height: 10, marginTop: 14 }}>
            <BarFill
              $pct={g.porcGlobalCuotasVsEsperado}
              $color={g.porcGlobalCuotasVsEsperado >= 90 ? '#10b981' : g.porcGlobalCuotasVsEsperado >= 60 ? TEAL : '#fb7185'}
            />
          </BarTrack>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: tokens.gray[400] }}>0%</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tokens.gray[600] }}>{g.porcGlobalCuotasVsEsperado}% logrado</span>
            <span style={{ fontSize: 11, color: tokens.gray[400] }}>100%</span>
          </div>
        </SummaryCard>

        {/* Proyección */}
        <SummaryCard
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .25 }}
        >
          <SummaryTitle>
            <IcoTarget size={15} color={tokens.gray[400]} />
            Proyección y Meta Anual
          </SummaryTitle>

          <MoneyRow>
            <MoneyLabel>Meta anual cuotas</MoneyLabel>
            <MoneyVal $bold>{formatCLP(g.totalMetaCuotas)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Recaudado hasta hoy</MoneyLabel>
            <MoneyVal $color="#059669">{formatCLP(g.totalRecCuotas)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Proyección fin de año</MoneyLabel>
            <MoneyVal $color={g.proyeccionAnual >= g.totalMetaCuotas ? '#059669' : '#f59e0b'} $bold>
              {formatCLP(Math.round(g.proyeccionAnual))}
            </MoneyVal>
          </MoneyRow>

          <div style={{ height: 1, background: tokens.gray[100], margin: '12px 0' }} />

          <MoneyRow>
            <MoneyLabel>Meta Polerón</MoneyLabel>
            <MoneyVal $bold>{formatCLP(g.totalMetaPoleron)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Recaudado polerón</MoneyLabel>
            <MoneyVal>{formatCLP(g.totalRecPoleron)}</MoneyVal>
          </MoneyRow>
          <MoneyRow>
            <MoneyLabel>Pendiente polerón</MoneyLabel>
            <MoneyVal $color={tokens.gray[500]}>{formatCLP(g.totalMetaPoleron - g.totalRecPoleron)}</MoneyVal>
          </MoneyRow>

          <BarTrack style={{ height: 10, marginTop: 14 }}>
            <BarFill $pct={g.porcGlobalPoleron} $color="#94a3b8" />
          </BarTrack>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: tokens.gray[400] }}>0%</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: tokens.gray[600] }}>{g.porcGlobalPoleron}% polerón</span>
            <span style={{ fontSize: 11, color: tokens.gray[400] }}>100%</span>
          </div>
        </SummaryCard>
      </SummaryRow>

      {/* Table */}
      <TableWrap>
        <TableHeader>
          <TableTitle>
            <IcoUsers size={16} color={TEAL} />
            Estado por alumno ({alumnosFiltrados.length})
          </TableTitle>
          <FilterGroup>
            {([
              { key: 'todos',      label: 'Todos',       color: TEAL },
              { key: 'al_dia',     label: 'Al día',      color: TEAL },
              { key: 'adelantado', label: 'Adelantados', color: '#10b981' },
              { key: 'atrasado',   label: 'Atrasados',   color: '#fb7185' },
            ] as const).map(f => (
              <FilterBtn
                key={f.key}
                $active={filter === f.key}
                $color={f.color}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== 'todos' && (
                  <span style={{ marginLeft: 4, opacity: .7 }}>
                    ({f.key === 'al_dia' ? g.alDia : f.key === 'adelantado' ? g.adelantados : g.atrasados})
                  </span>
                )}
              </FilterBtn>
            ))}
          </FilterGroup>
        </TableHeader>

        <AnimatePresence initial={false}>
          {alumnosFiltrados.map((alumno, idx) => {
            const isExpanded = expandedId === alumno.id
            return (
              <AlumnoRow
                key={alumno.id}
                $status={alumno.statusCuotas}
                layout
              >
                <AlumnoMain onClick={() => setExpandedId(isExpanded ? null : alumno.id)}>
                  <AlumnoIdx>{idx + 1}</AlumnoIdx>
                  <AlumnoAvatar $status={alumno.statusCuotas}>
                    {initials(alumno.nombre)}
                  </AlumnoAvatar>
                  <AlumnoInfo>
                    <p>{alumno.nombre}</p>
                    <p>Talla: {alumno.talla} · {alumno.cuotasPagadas.length} cuota{alumno.cuotasPagadas.length !== 1 ? 's' : ''} pagada{alumno.cuotasPagadas.length !== 1 ? 's' : ''}</p>
                  </AlumnoInfo>

                  <AlumnoBars>
                    <MiniBarRow>
                      <MiniBarLabel>Cuotas</MiniBarLabel>
                      <MiniBarTrack>
                        <MiniBarFill $pct={alumno.porcCuotasVsEsperado} $color={statusColor(alumno.statusCuotas)} />
                      </MiniBarTrack>
                      <MiniBarPct>{alumno.porcCuotasVsEsperado}%</MiniBarPct>
                    </MiniBarRow>
                    <MiniBarRow>
                      <MiniBarLabel>Polerón</MiniBarLabel>
                      <MiniBarTrack>
                        <MiniBarFill $pct={alumno.porcPoleron} $color="#94a3b8" />
                      </MiniBarTrack>
                      <MiniBarPct>{alumno.porcPoleron}%</MiniBarPct>
                    </MiniBarRow>
                  </AlumnoBars>

                  <StatusPill $status={alumno.statusCuotas}>
                    {statusIcon(alumno.statusCuotas)}
                    {statusLabel(alumno.statusCuotas)}
                  </StatusPill>
                  <PoleronDot $ok={alumno.poleronAlDia} title={alumno.poleronAlDia ? 'Polerón pagado' : 'Polerón pendiente'} />
                  {isExpanded ? <IcoChevronUp size={14} color={tokens.gray[400]} /> : <IcoChevronDown size={14} color={tokens.gray[400]} />}
                </AlumnoMain>

                <AnimatePresence>
                  {isExpanded && (
                    <ExpandedDetail
                      key="detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: .22 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <DetailLabel>Cuotas pagadas ({alumno.cuotasPagadas.length})</DetailLabel>
                          <TagRow>
                            {alumno.cuotasPagadas.length ? alumno.cuotasPagadas.map(c => (
                              <Tag key={c} $variant="ok">{c}</Tag>
                            )) : <Tag $variant="falta">Ninguna</Tag>}
                          </TagRow>

                          {alumno.cuotasAdelantadas.length > 0 && <>
                            <DetailLabel>Pagadas por adelantado</DetailLabel>
                            <TagRow>
                              {alumno.cuotasAdelantadas.map(c => (
                                <Tag key={c} $variant="adelanto">{c}</Tag>
                              ))}
                            </TagRow>
                          </>}

                          {alumno.cuotasAtrasadas.length > 0 && <>
                            <DetailLabel>⚠ Cuotas atrasadas ({alumno.cuotasAtrasadas.length})</DetailLabel>
                            <TagRow>
                              {alumno.cuotasAtrasadas.map(c => (
                                <Tag key={c} $variant="warn">{c}</Tag>
                              ))}
                            </TagRow>
                          </>}
                        </div>
                        <div>
                          <DetailLabel>Montos</DetailLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <MoneyRow>
                              <MoneyLabel>Cuotas pagadas</MoneyLabel>
                              <MoneyVal $bold $color="#059669">{formatCLP(alumno.montoCuotasPagado)}</MoneyVal>
                            </MoneyRow>
                            <MoneyRow>
                              <MoneyLabel>Esperado a hoy</MoneyLabel>
                              <MoneyVal>{formatCLP(alumno.montoCuotasEsperadas)}</MoneyVal>
                            </MoneyRow>
                            <MoneyRow>
                              <MoneyLabel>Meta anual cuotas</MoneyLabel>
                              <MoneyVal $color={tokens.gray[400]}>{formatCLP(alumno.montoCuotasMeta)}</MoneyVal>
                            </MoneyRow>
                          </div>

                          <DetailLabel style={{ marginTop: 12 }}>Polerón</DetailLabel>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <MoneyRow>
                              <MoneyLabel>Pagado</MoneyLabel>
                              <MoneyVal $bold>{formatCLP(alumno.montoPoleroPagado)}</MoneyVal>
                            </MoneyRow>
                            <MoneyRow>
                              <MoneyLabel>Valor ({alumno.talla})</MoneyLabel>
                              <MoneyVal $color={tokens.gray[400]}>{formatCLP(alumno.montoPoleroMeta)}</MoneyVal>
                            </MoneyRow>
                            <MoneyRow>
                              <MoneyLabel>Pendiente</MoneyLabel>
                              <MoneyVal $color={alumno.poleronAlDia ? '#059669' : '#be123c'}>
                                {alumno.poleronAlDia ? '✓ Completo' : formatCLP(alumno.montoPoleroMeta - alumno.montoPoleroPagado)}
                              </MoneyVal>
                            </MoneyRow>
                          </div>
                        </div>
                      </div>
                    </ExpandedDetail>
                  )}
                </AnimatePresence>
              </AlumnoRow>
            )
          })}
        </AnimatePresence>
      </TableWrap>
    </Page>
  )
}
