'use client'

import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { formatCLP, formatDate } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────
interface FondoDeposito {
  id: number
  fecha: string
  monto: number
  interesGanado: number
  descripcion: string
  pagador?: { nombre: string | null; email: string | null; identificacion: string | null }
  metodo?: string | null
  bancoOrigen?: string | null
  issuerId?: string | null
  bankTransferId?: string | null
  transactionId?: string | null
  esTransferenciaBancaria?: boolean
  otroIngresoId?: number | null
  nombreEditado?: string | null
}

interface FondoData {
  config: {
    tasaAnualPct: number
    notas: string
    updatedAt: string
  }
  saldoReal: {
    activo: boolean
    saldoSincronizado: number | null
    fechaSincronizacion: string | null
    ultimaSincronizacion: string | null
    interesRealAbonado: number | null
    interesEstimadoDesdeSync: number
  }
  stats: {
    totalDepositado: number
    totalInteres: number
    saldoTotal: number
    interesPorSegundo: number
    cantidadDepositos: number
    timestampCalculo: string
  }
  proyecciones: Array<{ dias: number; saldo: number; interes: number }>
  depositos: FondoDeposito[]
}

// ── SVG Icons ──────────────────────────────────────────────────────────
type Sp = { size?: number; color?: string }

const IcoTrend  = ({ size = 18, color = 'currentColor' }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IcoEdit   = ({ size = 16, color = 'currentColor' }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcoSave   = ({ size = 16, color = 'currentColor' }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoClose  = ({ size = 16, color = 'currentColor' }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IcoArrow  = ({ size = 14, color = 'currentColor' }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IcoRefresh = ({ size = 14, color = 'currentColor', spin = false }: Sp & { spin?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={spin ? { animation: 'spin 1s linear infinite' } : undefined}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
)

// ── Constants ──────────────────────────────────────────────────────────
const TEAL  = '#22b2b2'
const TEAL2 = '#1d9e9e'
const BG    = '#f9fafb'
const CARD  = '#ffffff'

// ── Styled ─────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 28px 32px;
  min-height: 100vh;
  @media (max-width: 768px) { padding: 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
`

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  @media (max-width: 640px) { flex-direction: column; }
`

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const IconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, ${TEAL}22, ${TEAL}44);
  border: 1px solid ${TEAL}33;
  display: flex;
  align-items: center;
  justify-content: center;
`

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #0d1117;
  line-height: 1;
`

const Subtitle = styled.p`
  font-size: 13px;
  color: #6b7280;
  margin-top: 3px;
`

const RefreshBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid ${TEAL}44;
  background: ${TEAL}11;
  color: ${TEAL2};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
  &:hover { background: ${TEAL}22; border-color: ${TEAL}66; }
`

const Grid4 = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 1024px) { grid-template-columns: repeat(2,1fr); }
  @media (max-width: 500px)  { grid-template-columns: 1fr; }
`

interface KpiCardProps { $accent?: string }
const KpiCard = styled(motion.div)<KpiCardProps>`
  background: ${CARD};
  border-radius: 14px;
  border: 1px solid ${p => p.$accent ? `${p.$accent}22` : '#e5e7eb'};
  padding: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: ${p => p.$accent ?? TEAL};
    border-radius: 14px 14px 0 0;
    opacity: .7;
  }
`

const KpiLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #9ca3af;
  margin: 0;
`

const KpiValue = styled.p`
  font-size: 26px;
  font-weight: 700;
  color: #0d1117;
  margin: 6px 0 0;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`

const KpiSmall = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0;
`

const KpiBadge = styled.span<{ $color?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 20px;
  background: ${p => p.$color ? `${p.$color}18` : `${TEAL}18`};
  color: ${p => p.$color ?? TEAL2};
  margin-top: 8px;
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`

const Card = styled.div`
  background: ${CARD};
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  overflow: hidden;
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
`

const CardTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
`

const CardBody = styled.div`
  padding: 16px 20px;
`

// Proyecciones bar chart ──────────────────────────────────────────────
const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  &:last-child { margin-bottom: 0; }
`

const BarLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  width: 50px;
  flex-shrink: 0;
`

const BarTrack = styled.div`
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
`

const BarFill = styled(motion.div)<{ $pct: number; $color?: string }>`
  width: ${p => p.$pct}%;
  height: 100%;
  background: ${p => p.$color ?? `linear-gradient(90deg, ${TEAL}, #34d399)`};
  border-radius: 99px;
`

const BarMonto = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  width: 110px;
  text-align: right;
  flex-shrink: 0;
`

// Config form ─────────────────────────────────────────────────────────
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`

const Label = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  display: block;
  margin-bottom: 4px;
`

const Input = styled.input`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #0d1117;
  background: #fafafa;
  outline: none;
  font-variant-numeric: tabular-nums;
  transition: border-color .15s;
  box-sizing: border-box;
  &:focus { border-color: ${TEAL}; background: #fff; }
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #0d1117;
  background: #fafafa;
  outline: none;
  resize: vertical;
  min-height: 60px;
  transition: border-color .15s;
  box-sizing: border-box;
  &:focus { border-color: ${TEAL}; background: #fff; }
`

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
`

const Btn = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  border: ${p => p.$primary ? 'none' : `1px solid #e5e7eb`};
  background: ${p => p.$primary ? TEAL : 'transparent'};
  color: ${p => p.$primary ? '#fff' : '#6b7280'};
  &:hover {
    background: ${p => p.$primary ? TEAL2 : '#f3f4f6'};
  }
  &:disabled { opacity: .5; cursor: not-allowed; }
`

// Movimientos list ────────────────────────────────────────────────────
const MovRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid #f9fafb;
  &:last-child { border-bottom: none; }
  &:hover { background: #f9fafb; }
  transition: background .1s;
`

const MovDate = styled.span`
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
`

const MovDesc = styled.span`
  font-size: 13px;
  color: #374151;
  flex: 1;
  margin: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MovMonto = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #34d399;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

// Live counter ─────────────────────────────────────────────────────────
const LiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #34d399;
  background: #34d39918;
  px: 8px;
  padding: 2px 8px;
  border-radius: 20px;
`

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
`

// ── Component ─────────────────────────────────────────────────────────
export default function FondoPage() {
  const { data, isLoading, mutate } = useFetch<FondoData>('/api/mercadopago/fondo')

  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm] = useState({ tasaAnualPct: '', notas: '' })

  const openEdit = (src?: FondoData) => {
    const cfg = (src ?? data)?.config
    if (!cfg) return
    setForm({ tasaAnualPct: String(cfg.tasaAnualPct), notas: cfg.notas ?? '' })
    setEditing(true)
  }

  // Live interest counter — ticks every second from the API timestamp
  const [liveExtra, setLiveExtra] = useState(0)
  const baseInteres   = useRef(0)
  const baseTimestamp = useRef<number>(0)
  const perSeg        = useRef(0)

  useEffect(() => {
    if (!data) return
    baseInteres.current   = data.stats.totalInteres
    perSeg.current        = data.stats.interesPorSegundo
    baseTimestamp.current = new Date(data.stats.timestampCalculo).getTime()
    setLiveExtra(0)
  }, [data])

  useEffect(() => {
    const id = setInterval(() => {
      if (!perSeg.current) return
      const elapsed = (Date.now() - baseTimestamp.current) / 1000
      setLiveExtra(elapsed * perSeg.current)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const liveInteres    = baseInteres.current + liveExtra
  // Si tenemos saldo real sincronizado, ese es la base autoritativa (incluye retiros).
  // El "live" se construye sobre stats.saldoTotal (que ya viene con saldoReal + extrapolación).
  const saldoTotalLive = data
    ? (data.saldoReal.activo
        ? data.stats.saldoTotal + liveExtra
        : data.stats.totalDepositado + liveInteres)
    : 0

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/mercadopago/fondo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasaAnualPct: Number(form.tasaAnualPct),
          notas:        form.notas,
        }),
      })
      await mutate()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const maxInteres = data
    ? Math.max(...data.proyecciones.map(p => p.interes), 1)
    : 1

  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const handleSync = async () => {
    setSyncing(true); setSyncError(null); setSyncStatus('Solicitando reporte a MP...')
    try {
      const r = await fetch('/api/mercadopago/fondo/sync', { method: 'POST' })
      const j = await r.json()
      if (!r.ok || !j.taskId) { setSyncError(j.error || 'Error al iniciar'); setSyncing(false); return }
      const taskId = j.taskId
      setSyncStatus('Reporte ' + taskId + ' en cola... (1-3 min)')
      const deadline = Date.now() + 5 * 60000
      let attempts = 0
      while (Date.now() < deadline) {
        await new Promise(res => setTimeout(res, 5000))
        attempts++
        const pr = await fetch('/api/mercadopago/fondo/sync?taskId=' + taskId)
        const pj = await pr.json()
        if (!pr.ok) { setSyncError(pj.error || 'Error consultando'); setSyncing(false); return }
        if (pj.ready) {
          setSyncStatus('Saldo real: $' + (pj.saldoReal ?? 0).toLocaleString('es-CL'))
          await mutate(); setSyncing(false); return
        }
        setSyncStatus('Procesando... (' + (attempts * 5) + 's, estado: ' + pj.status + ')')
      }
      setSyncError('Timeout (5 min)'); setSyncing(false)
    } catch (e) { setSyncError(String(e)); setSyncing(false) }
  }

  return (
    <Page style={{ background: BG }}>
      {/* Header */}
      <PageHeader>
        <TitleRow>
          <IconCircle>
            <IcoTrend size={20} color={TEAL} />
          </IconCircle>
          <div>
            <Title>Fondo MercadoPago</Title>
            <Subtitle>
              {data?.saldoReal.activo
                ? 'Saldo real desde MP · interés extrapolado en vivo'
                : 'Interés calculado por depósito · cuenta remunerada'}
              {data?.config.notas ? ` · ${data.config.notas}` : ''}
            </Subtitle>
          </div>
        </TitleRow>
        <div style={{ display: 'flex', gap: 8 }}>
          <RefreshBtn
            onClick={handleSync}
            disabled={syncing}
            style={{ background: '#34d39911', color: '#059669', borderColor: '#34d39944' }}
            title="Genera un release_report oficial de MP y trae el saldo real (~30-60s)"
          >
            <IcoRefresh size={14} spin={syncing} />
            {syncing ? 'Sincronizando...' : 'Sincronizar saldo real'}
          </RefreshBtn>
          <RefreshBtn onClick={() => mutate()} disabled={isLoading}>
            <IcoRefresh size={14} spin={isLoading} />
            Actualizar
          </RefreshBtn>
        </div>
      </PageHeader>

      {syncStatus && !syncError && (
        <div style={{
          background: '#34d39911', border: '1px solid #34d39955',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#047857',
        }}>
          {syncing ? '⏳ ' : '✓ '}{syncStatus}
        </div>
      )}
      {syncError && (
        <div style={{
          background: '#fb718511', border: '1px solid #fb718555',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#b91c1c',
        }}>
          ⚠ {syncError}
        </div>
      )}

      {data?.saldoReal.activo && data.saldoReal.fechaSincronizacion && (
        <div style={{
          background: '#34d39911', border: '1px solid #34d39944',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 12, color: '#065f46',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <span>
            <strong>Saldo real:</strong> {formatCLP(data.saldoReal.saldoSincronizado || 0)}
            {' '}al {formatDate(data.saldoReal.fechaSincronizacion)}
            {data.saldoReal.interesRealAbonado !== null && (
              <> · <strong>Interés abonado por MP:</strong> {formatCLP(data.saldoReal.interesRealAbonado)}</>
            )}
            {' '}· Sincronizado: {data.saldoReal.ultimaSincronizacion ? formatDate(data.saldoReal.ultimaSincronizacion) : '—'}
          </span>
        </div>
      )}

      {/* KPI cards */}
      <Grid4>
        <KpiCard
          $accent={TEAL}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KpiLabel>Total depositado</KpiLabel>
          <KpiValue>
            {data ? formatCLP(data.stats.totalDepositado) : '—'}
          </KpiValue>
          <KpiSmall>
            {data ? `${data.stats.cantidadDepositos} depósitos` : 'Cargando...'}
          </KpiSmall>
          <KpiBadge>desde la primera transferencia</KpiBadge>
        </KpiCard>

        <KpiCard
          $accent="#34d399"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .06 }}
        >
          <KpiLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              Interés generado
              {data && <LiveBadge><LiveDot/>LIVE</LiveBadge>}
            </span>
          </KpiLabel>
          <KpiValue style={{ color: '#34d399' }}>
            {data ? formatCLP(Math.round(liveInteres)) : '—'}
          </KpiValue>
          <KpiSmall>
            +{data
              ? formatCLP(Math.round(data.stats.interesPorSegundo * 86400))
              : '—'} por día
          </KpiSmall>
          <KpiBadge $color="#34d399">
            {data
              ? `+${(data.stats.interesPorSegundo * 1000).toFixed(4)} $/s`
              : '—'}
          </KpiBadge>
        </KpiCard>

        <KpiCard
          $accent="#8098f9"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .12 }}
        >
          <KpiLabel>Saldo total estimado</KpiLabel>
          <KpiValue style={{ color: '#8098f9' }}>
            {data ? formatCLP(Math.round(saldoTotalLive)) : '—'}
          </KpiValue>
          <KpiSmall>depósitos + interés acumulado</KpiSmall>
          <KpiBadge $color="#8098f9">
            {data
              ? `+${((liveInteres / (data.stats.totalDepositado || 1)) * 100).toFixed(3)}%`
              : '—'}
          </KpiBadge>
        </KpiCard>

        <KpiCard
          $accent="#f59e0b"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .18 }}
        >
          <KpiLabel>Tasa anual (TNA)</KpiLabel>
          <KpiValue style={{ color: '#f59e0b' }}>
            {data ? `${data.config.tasaAnualPct}%` : '—'}
          </KpiValue>
          <KpiSmall>Cuenta remunerada MP Chile</KpiSmall>
          <KpiBadge $color="#f59e0b">
            {data
              ? `${(data.config.tasaAnualPct / 12).toFixed(2)}% mensual`
              : '—'}
          </KpiBadge>
        </KpiCard>
      </Grid4>

      {/* Proyecciones + Config */}
      <Grid2>
        {/* Proyecciones */}
        <Card>
          <CardHeader>
            <CardTitle>
              <IcoTrend size={14} color={TEAL} />
              Proyección de crecimiento
            </CardTitle>
          </CardHeader>
          <CardBody>
            {data ? data.proyecciones.map(p => (
              <BarRow key={p.dias}>
                <BarLabel>{p.dias === 365 ? '1 año' : `${p.dias}d`}</BarLabel>
                <BarTrack>
                  <BarFill
                    $pct={(p.interes / maxInteres) * 100}
                    initial={{ width: 0 }}
                    animate={{ width: `${(p.interes / maxInteres) * 100}%` }}
                    transition={{ duration: .7, delay: .1 }}
                  />
                </BarTrack>
                <BarMonto>
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>+</span>
                  {' '}{formatCLP(p.interes)}
                </BarMonto>
              </BarRow>
            )) : (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                Cargando proyecciones...
              </p>
            )}
          </CardBody>
        </Card>

        {/* Config */}
        <Card>
          <CardHeader>
            <CardTitle>
              <IcoEdit size={14} color="#6b7280" />
              Configuración del fondo
            </CardTitle>
            {!editing && (
              <Btn onClick={() => openEdit()} style={{ padding: '5px 12px' }}>
                <IcoEdit size={12} /> Editar
              </Btn>
            )}
          </CardHeader>
          <CardBody>
            {!editing ? (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {[
                      ['Total depositado',      data ? formatCLP(data.stats.totalDepositado) : '—'],
                      ['Interés acumulado',      data ? formatCLP(Math.round(liveInteres)) : '—'],
                      ['Saldo total estimado',   data ? formatCLP(Math.round(saldoTotalLive)) : '—'],
                      ['TNA',                    data ? `${data.config.tasaAnualPct}%` : '—'],
                      ['Depósitos',              data ? `${data.stats.cantidadDepositos} transferencias` : '—'],
                      ['Notas',                  data?.config.notas || '—'],
                    ].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '7px 0', color: '#6b7280', width: '50%' }}>{label}</td>
                        <td style={{ padding: '7px 0', fontWeight: 600, color: '#0d1117' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
                  Calculado en tiempo real desde los depósitos · actualizado {data ? formatDate(data.config.updatedAt) : '—'}
                </p>
              </>
            ) : (
              <>
                <FormGrid>
                  <div>
                    <Label>TNA % anual (lo que muestra MP)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.tasaAnualPct}
                      onChange={e => setForm(f => ({ ...f, tasaAnualPct: e.target.value }))}
                      placeholder="ej: 3.5"
                    />
                  </div>
                  <div>
                    <Label>Notas</Label>
                    <Textarea
                      value={form.notas}
                      onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                      placeholder="ej: incluye depósito de marzo"
                    />
                  </div>
                </FormGrid>
                <BtnRow>
                  <Btn onClick={() => setEditing(false)}>
                    <IcoClose size={12} /> Cancelar
                  </Btn>
                  <Btn $primary onClick={handleSave} disabled={saving}>
                    <IcoSave size={12} />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </Btn>
                </BtnRow>
              </>
            )}
          </CardBody>
        </Card>
      </Grid2>

      {/* Deposits with per-deposit interest */}
      <Card>
        <CardHeader>
          <CardTitle>
            <IcoArrow size={14} color={TEAL} />
            Depósitos e interés por transferencia
            {data && (
              <span style={{ fontSize: 12, fontWeight: 400, color: '#9ca3af' }}>
                · {data.stats.cantidadDepositos} depósitos
              </span>
            )}
          </CardTitle>
          {data && (
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Total:{' '}
              <strong style={{ color: '#0d1117' }}>
                {formatCLP(data.stats.totalDepositado)}
              </strong>
            </span>
          )}
        </CardHeader>
        {isLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            Cargando depósitos...
          </div>
        ) : !data ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#fb7185', fontSize: 13 }}>
            No se pudieron cargar los datos.
          </div>
        ) : data.depositos.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
            No se encontraron depósitos aprobados.
          </div>
        ) : (
          data.depositos.slice(0, 25).map(d => {
            // Si el admin ya editó el nombre del OtroIngreso, lo priorizamos
            const titulo =
              d.nombreEditado
              || d.pagador?.nombre
              || (d.esTransferenciaBancaria
                    ? (d.bancoOrigen ? `TEF · ${d.bancoOrigen}` : 'Transferencia bancaria')
                    : 'Pago MercadoPago')

            const subList: string[] = []
            if (d.descripcion && d.descripcion !== 'Transferencia recibida') subList.push(d.descripcion)
            if (d.transactionId)        subList.push(`Ref: ${d.transactionId}`)
            else if (d.bankTransferId)  subList.push(`ID: ${d.bankTransferId}`)
            const subtitulo = subList.join(' · ')

            const handleRename = async () => {
              const sugerido = d.nombreEditado || d.pagador?.nombre || ''
              const nuevo = window.prompt(
                'Anotar / renombrar este depósito\n(quién lo hizo, propósito, etc.)',
                sugerido,
              )
              if (!nuevo || nuevo.trim().length < 2) return
              const res = await fetch(`/api/mercadopago/payments/${d.id}/note`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevo.trim() }),
              })
              if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                window.alert(`Error: ${err.error ?? res.statusText}`)
                return
              }
              window.location.reload()
            }

            return (
              <MovRow key={d.id}>
                <MovDate>{formatDate(d.fecha)}</MovDate>
                <div style={{ flex: 1, minWidth: 0, margin: '0 12px' }}>
                  <div style={{
                    fontSize: 13,
                    color: d.nombreEditado ? '#0d1117' : '#374151',
                    fontWeight: d.nombreEditado ? 600 : 400,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{titulo}</div>
                  {subtitulo && (
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subtitulo}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <MovMonto>+{formatCLP(d.monto)}</MovMonto>
                  <span style={{ fontSize: 11, color: '#34d399', fontVariantNumeric: 'tabular-nums' }}>
                    +{formatCLP(d.interesGanado)} interés
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRename}
                  title={d.nombreEditado ? 'Editar anotación' : 'Anotar quién pagó'}
                  style={{
                    marginLeft: 12,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: `1px solid ${d.nombreEditado ? '#22b2b244' : '#e5e7eb'}`,
                    background: d.nombreEditado ? '#22b2b211' : '#ffffff',
                    color: d.nombreEditado ? '#1d9e9e' : '#6b7280',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#22b2b266'
                    e.currentTarget.style.background  = '#22b2b211'
                    e.currentTarget.style.color       = '#1d9e9e'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = d.nombreEditado ? '#22b2b244' : '#e5e7eb'
                    e.currentTarget.style.background  = d.nombreEditado ? '#22b2b211' : '#ffffff'
                    e.currentTarget.style.color       = d.nombreEditado ? '#1d9e9e' : '#6b7280'
                  }}
                >
                  ✎ {d.nombreEditado ? 'editar' : 'anotar'}
                </button>
              </MovRow>
            )
          })
        )}
      </Card>
    </Page>
  )
}
