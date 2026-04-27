'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { tokens } from '@/styles/theme'
import { formatCLP, getInitials } from '@/lib/utils'
import { useFetch } from '@/lib/useFetch'

const TEAL = '#22b2b2'

// ── SVG Icons (inline, sin librería) ──────────────────────────────────
type Sp = { size?: number; color?: string; strokeWidth?: number }
const Svg = ({ size = 16, color = 'currentColor', strokeWidth = 2, children }: Sp & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const IcoSearch = (p: Sp) => <Svg {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Svg>
const IcoUsers  = (p: Sp) => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>
const IcoCheck  = (p: Sp) => <Svg {...p}><path d="M20 6L9 17l-5-5"/></Svg>
const IcoClock  = (p: Sp) => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
const IcoAlert  = (p: Sp) => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>
const IcoArrow  = (p: Sp) => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>
const IcoGrid   = (p: Sp) => <Svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></Svg>
const IcoList   = (p: Sp) => <Svg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></Svg>
const IcoEdit   = (p: Sp) => <Svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>
const IcoClose  = (p: Sp) => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>
const IcoPlus   = (p: Sp) => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
const IcoSpinner = ({ size = 16 }: Sp) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin .8s linear infinite' }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity=".25"/>
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
  </svg>
)
const IcoShirt  = (p: Sp) => <Svg {...p}><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></Svg>

// ── Styled ────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px 36px;
  max-width: 1360px;
  @media (max-width: 768px) { padding: 18px 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
  flex-wrap: wrap;
`

const HeaderLeft = styled.div`
  h1 { font-size: 20px; font-weight: 700; color: ${tokens.gray[900]}; letter-spacing: -.3px; }
  p  { color: ${tokens.gray[400]}; font-size: 13px; margin-top: 3px; }
`

const Toolbar = styled.div`
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
`

const SearchWrap = styled.div`
  position: relative;
  svg { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: ${tokens.gray[400]}; }
  input {
    padding: 9px 12px 9px 34px;
    border: 1px solid ${tokens.gray[200]};
    border-radius: 10px;
    font-size: 13px;
    background: #fff;
    width: 260px;
    outline: none;
    transition: all .15s;
    color: ${tokens.gray[800]};
    &::placeholder { color: ${tokens.gray[400]}; }
    &:focus { border-color: ${TEAL}; box-shadow: 0 0 0 3px ${TEAL}22; }
  }
`

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid ${tokens.gray[200]};
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
`
const ViewBtn = styled.button<{ $active: boolean }>`
  padding: 8px 11px;
  border: none;
  cursor: pointer;
  background: ${p => p.$active ? TEAL : 'transparent'};
  color: ${p => p.$active ? '#fff' : tokens.gray[400]};
  display: flex; align-items: center;
  transition: all .15s;
  &:hover { background: ${p => p.$active ? TEAL : tokens.gray[50]}; color: ${p => p.$active ? '#fff' : tokens.gray[700]}; }
`

// KPI cards estilo dashboard (icon-on-top)
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`
const KpiCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`
const KpiIcon = styled.div<{ $color: string }>`
  margin-bottom: 10px;
  color: ${p => p.$color};
`
const KpiValue = styled.div`
  font-size: 24px; font-weight: 800;
  color: ${tokens.gray[900]}; letter-spacing: -.4px;
  line-height: 1; margin-bottom: 5px;
  font-variant-numeric: tabular-nums;
`
const KpiLabel = styled.div`
  font-size: 12px; color: ${tokens.gray[400]}; font-weight: 500;
`

const FilterRow = styled.div`
  display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap;
`
const FilterPill = styled.button<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 13px;
  border-radius: 99px;
  font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: all .15s;
  background: ${p => p.$active ? tokens.gray[900] : '#fff'};
  color:      ${p => p.$active ? '#fff'           : tokens.gray[600]};
  border: 1px solid ${p => p.$active ? tokens.gray[900] : tokens.gray[200]};
  &:hover { background: ${p => p.$active ? tokens.gray[800] : tokens.gray[50]}; }
  .count {
    background: ${p => p.$active ? 'rgba(255,255,255,.2)' : tokens.gray[100]};
    color:      ${p => p.$active ? '#fff' : tokens.gray[500]};
    border-radius: 99px; padding: 0 7px; font-size: 10.5px; font-weight: 700;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
`

const StudentCard = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
  transition: box-shadow .2s, transform .15s, border-color .15s;
  &:hover { box-shadow: 0 6px 16px rgba(0,0,0,.06); border-color: ${tokens.gray[200]}; }
`

const StudentRow = styled.div`
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
`

const Avatar = styled.div<{ $status: string }>`
  width: 40px; height: 40px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13.5px; font-weight: 800;
  flex-shrink: 0;
  background: ${p => ({ paid: tokens.emerald[500] + '15', partial: tokens.amber[500] + '15', pending: tokens.rose[500] + '15' } as Record<string,string>)[p.$status]};
  color:      ${p => ({ paid: tokens.emerald[600],         partial: tokens.amber[600],         pending: tokens.rose[600]         } as Record<string,string>)[p.$status]};
`

const NameBlock = styled.div`
  flex: 1; min-width: 0;
  .last  { font-size: 13.5px; font-weight: 700; color: ${tokens.gray[800]}; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .first { font-size: 11.5px; color: ${tokens.gray[400]}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`

const Pill = styled.span<{ $status: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 99px;
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px;
  background: ${p => ({ paid: tokens.emerald[500] + '15', partial: tokens.amber[500] + '15', pending: tokens.rose[500] + '15' } as Record<string,string>)[p.$status]};
  color:      ${p => ({ paid: tokens.emerald[600],         partial: tokens.amber[600],         pending: tokens.rose[600]         } as Record<string,string>)[p.$status]};
`

const ProgressWrap = styled.div`
  margin-top: 6px;
`
const ProgLabel = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  font-size: 11.5px; color: ${tokens.gray[500]}; margin-bottom: 5px;
  strong { font-weight: 700; color: ${tokens.gray[800]}; font-variant-numeric: tabular-nums; }
`
const ProgBar = styled.div`
  height: 5px; background: ${tokens.gray[100]}; border-radius: 99px; overflow: hidden;
  div { height: 100%; border-radius: 99px; transition: width .6s cubic-bezier(.16,1,.3,1); }
`

const CardActions = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid ${tokens.gray[100]};
  display: flex; gap: 8px;
`

const ActionBtn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  padding: 7px 10px;
  font-size: 12px; font-weight: 600;
  border-radius: 9px;
  cursor: pointer;
  transition: all .15s;
  background: ${p => p.$variant === 'primary' ? TEAL : '#fff'};
  color:      ${p => p.$variant === 'primary' ? '#fff' : tokens.gray[600]};
  border: 1px solid ${p => p.$variant === 'primary' ? TEAL : tokens.gray[200]};
  text-decoration: none;
  &:hover {
    background: ${p => p.$variant === 'primary' ? '#1d9e9e' : tokens.gray[50]};
    color:      ${p => p.$variant === 'primary' ? '#fff' : tokens.gray[800]};
  }
`

// ── Drawer (manage payments) ─────────────────────────────────────────
const Backdrop = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, .35);
  z-index: 100;
`
const Drawer = styled(motion.div)`
  position: fixed; top: 0; right: 0; bottom: 0;
  width: 460px; max-width: 100vw;
  background: #fff;
  z-index: 101;
  display: flex; flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,.12);
`
const DrawerHead = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${tokens.gray[100]};
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
`
const DrawerBody = styled.div`
  flex: 1; overflow-y: auto;
  padding: 12px 24px 24px;
`
const DrawerTitle = styled.div`
  h3 { font-size: 15px; font-weight: 700; color: ${tokens.gray[900]}; line-height: 1.3; }
  p  { font-size: 12px; color: ${tokens.gray[400]}; margin-top: 2px; }
`
const CloseBtn = styled.button`
  background: transparent; border: none; cursor: pointer;
  width: 32px; height: 32px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: ${tokens.gray[400]};
  &:hover { background: ${tokens.gray[100]}; color: ${tokens.gray[700]}; }
`

const ItemRow = styled.div<{ $paid: boolean; $partial: boolean }>`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 11px;
  margin-bottom: 8px;
  transition: all .15s;
  background: ${p => p.$paid ? tokens.emerald[500] + '08' : '#fff'};
  border-color: ${p => p.$paid ? tokens.emerald[500] + '30' : tokens.gray[100]};
`
const ItemCheck = styled.button<{ $paid: boolean }>`
  width: 22px; height: 22px;
  border-radius: 6px;
  border: 2px solid ${p => p.$paid ? tokens.emerald[500] : tokens.gray[300]};
  background: ${p => p.$paid ? tokens.emerald[500] : '#fff'};
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
  &:hover { border-color: ${tokens.emerald[600]}; }
  &:disabled { opacity: .5; cursor: wait; }
`
const ItemMeta = styled.div`
  flex: 1; min-width: 0;
  .name { font-size: 13px; font-weight: 600; color: ${tokens.gray[800]}; }
  .sub  { font-size: 11px; color: ${tokens.gray[400]}; margin-top: 1px; }
`
const ItemAmount = styled.div<{ $paid: boolean }>`
  text-align: right;
  .amt  { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums;
          color: ${p => p.$paid ? tokens.emerald[600] : tokens.gray[700]}; }
  .pct  { font-size: 10.5px; color: ${tokens.gray[400]}; margin-top: 1px; }
`

const Skeleton = styled.div`
  background: linear-gradient(90deg, ${tokens.gray[100]} 25%, ${tokens.gray[200]} 50%, ${tokens.gray[100]} 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 14px;
  @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
`

const Empty = styled.div`
  text-align: center; padding: 60px 20px;
  color: ${tokens.gray[400]};
  svg { margin: 0 auto 12px; display: block; opacity: .35; }
  p.t  { font-weight: 600; color: ${tokens.gray[600]}; }
  p.s  { font-size: 13px; margin-top: 4px; }
`

// ── Tipos ─────────────────────────────────────────────────────────────
interface Item {
  id: number; nombre: string; valor: number; tipo: number
}
interface Pago {
  id: number; itemId: number; monto: number; itemNombre: string; fecha: string
}
interface Alumno {
  id: number; nombre: string; apoderados: string[]
  totalPagado: number; totalDeuda: number; saldoPendiente: number
  estadoGeneral: 'paid' | 'partial' | 'pending'
  pagos: Pago[]
  tallaPoleron: { nombre: string; valor: number } | null
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Al día', partial: 'Parcial', pending: 'Pendiente',
}

// ── Component ─────────────────────────────────────────────────────────
export default function EstudiantesPage() {
  const { data, isLoading, mutate } = useFetch<{ alumnos: Alumno[]; items: Item[] }>('/api/alumnos')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'partial' | 'pending'>('all')
  const [view, setView]     = useState<'grid' | 'list'>('grid')
  const [drawerAlumno, setDrawerAlumno] = useState<Alumno | null>(null)
  const [savingItemId, setSavingItemId] = useState<number | null>(null)

  const alumnos = data?.alumnos ?? []
  const items   = data?.items   ?? []

  const counts = useMemo(() => ({
    all:     alumnos.length,
    paid:    alumnos.filter(a => a.estadoGeneral === 'paid').length,
    partial: alumnos.filter(a => a.estadoGeneral === 'partial').length,
    pending: alumnos.filter(a => a.estadoGeneral === 'pending').length,
  }), [alumnos])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return alumnos.filter(a => {
      const matchSearch = !q
        || a.nombre.toLowerCase().includes(q)
        || a.apoderados.some(ap => ap.toLowerCase().includes(q))
      const matchFilter = filter === 'all' || a.estadoGeneral === filter
      return matchSearch && matchFilter
    })
  }, [alumnos, search, filter])

  const totalRecaudado = alumnos.reduce((s, a) => s + a.totalPagado, 0)

  // Calcular estado por item para el drawer del alumno
  const itemsConEstado = useMemo(() => {
    if (!drawerAlumno) return []
    const pagosPorItem = new Map<number, number>()
    drawerAlumno.pagos.forEach(p => {
      pagosPorItem.set(p.itemId, (pagosPorItem.get(p.itemId) ?? 0) + p.monto)
    })
    return items
      .slice()
      .sort((a, b) => a.tipo - b.tipo || a.id - b.id)
      .map(it => {
        const valor = it.tipo === 1
          ? (drawerAlumno.tallaPoleron?.valor ?? it.valor)
          : it.valor
        const pagado    = pagosPorItem.get(it.id) ?? 0
        const pendiente = Math.max(0, valor - pagado)
        const estado: 'paid' | 'partial' | 'pending'
          = pendiente === 0 && valor > 0 ? 'paid'
          : pagado > 0 ? 'partial' : 'pending'
        return { ...it, valor, pagado, pendiente, estado }
      })
  }, [drawerAlumno, items])

  const togglePaid = async (itemId: number, currentlyPaid: boolean) => {
    if (!drawerAlumno) return
    if (!currentlyPaid) {
      // Confirmación antes de marcar como NO pagado se omite por velocidad,
      // pero si ya está pagado y vamos a desmarcar, sí preguntamos.
    }
    if (currentlyPaid) {
      const ok = window.confirm('¿Desmarcar este item como pagado? Se eliminarán los pagos asociados.')
      if (!ok) return
    }
    setSavingItemId(itemId)
    try {
      const res = await fetch(`/api/alumnos/${drawerAlumno.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado: !currentlyPaid }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        window.alert(`Error: ${err.error ?? res.statusText}`)
        return
      }
      // Refrescar lista y mantener el alumno actualizado en el drawer
      mutate()
      const fresh = await fetch('/api/alumnos').then(r => r.json()).catch(() => null) as { alumnos: Alumno[] } | null
      const updated = fresh?.alumnos.find(a => a.id === drawerAlumno.id)
      if (updated) setDrawerAlumno(updated)
    } finally {
      setSavingItemId(null)
    }
  }

  return (
    <Page>
      <Header>
        <HeaderLeft>
          <h1>Estudiantes</h1>
          <p>{alumnos.length} estudiantes · gestiona el estado de pagos</p>
        </HeaderLeft>
        <Toolbar>
          <SearchWrap>
            <IcoSearch size={14} />
            <input
              placeholder="Buscar estudiante o apoderado…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </SearchWrap>
          <ViewToggle>
            <ViewBtn $active={view === 'grid'} onClick={() => setView('grid')} title="Tarjetas"><IcoGrid size={15} /></ViewBtn>
            <ViewBtn $active={view === 'list'} onClick={() => setView('list')} title="Lista"><IcoList size={15} /></ViewBtn>
          </ViewToggle>
        </Toolbar>
      </Header>

      <KpiGrid>
        <KpiCard initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
          <KpiIcon $color={tokens.gray[400]}><IcoUsers size={16} /></KpiIcon>
          <KpiValue>{counts.all}</KpiValue>
          <KpiLabel>Total estudiantes</KpiLabel>
        </KpiCard>
        <KpiCard initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.04 }}>
          <KpiIcon $color={tokens.emerald[500]}><IcoCheck size={16} /></KpiIcon>
          <KpiValue>{counts.paid}</KpiValue>
          <KpiLabel>Al día</KpiLabel>
        </KpiCard>
        <KpiCard initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.08 }}>
          <KpiIcon $color={tokens.amber[500]}><IcoClock size={16} /></KpiIcon>
          <KpiValue>{counts.partial}</KpiValue>
          <KpiLabel>Pago parcial</KpiLabel>
        </KpiCard>
        <KpiCard initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.12 }}>
          <KpiIcon $color={tokens.rose[500]}><IcoAlert size={16} /></KpiIcon>
          <KpiValue>{counts.pending}</KpiValue>
          <KpiLabel>Sin pagos</KpiLabel>
        </KpiCard>
      </KpiGrid>

      <FilterRow>
        {(['all','paid','partial','pending'] as const).map(f => (
          <FilterPill key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === 'all'     && <IcoUsers size={12} />}
            {f === 'paid'    && <IcoCheck size={12} />}
            {f === 'partial' && <IcoClock size={12} />}
            {f === 'pending' && <IcoAlert size={12} />}
            {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
            <span className="count">{counts[f]}</span>
          </FilterPill>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: tokens.gray[400], alignSelf: 'center' }}>
          Recaudado: <strong style={{ color: tokens.gray[800], fontWeight: 700 }}>{formatCLP(totalRecaudado)}</strong>
        </div>
      </FilterRow>

      {isLoading ? (
        <Grid>
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} style={{ height: 180 }} />)}
        </Grid>
      ) : view === 'grid' ? (
        <Grid>
          <AnimatePresence>
            {filtered.map((a, i) => {
              const pct = a.totalDeuda > 0 ? Math.round((a.totalPagado / a.totalDeuda) * 100) : 0
              const barColor = a.estadoGeneral === 'paid' ? tokens.emerald[500]
                : a.estadoGeneral === 'partial' ? tokens.amber[500] : tokens.rose[400]
              const [last, first] = a.nombre.split(',').map(s => s.trim())

              return (
                <StudentCard key={a.id}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: i * 0.015 }}>
                  <StudentRow>
                    <Avatar $status={a.estadoGeneral}>{getInitials(a.nombre)}</Avatar>
                    <NameBlock>
                      <div className="last">{last}</div>
                      {first && <div className="first">{first}</div>}
                    </NameBlock>
                    <Pill $status={a.estadoGeneral}>
                      {a.estadoGeneral === 'paid' && <IcoCheck size={9} />}
                      {a.estadoGeneral === 'partial' && <IcoClock size={9} />}
                      {a.estadoGeneral === 'pending' && <IcoAlert size={9} />}
                      {STATUS_LABELS[a.estadoGeneral]}
                    </Pill>
                  </StudentRow>

                  <ProgressWrap>
                    <ProgLabel>
                      <span>Pagado <strong>{formatCLP(a.totalPagado)}</strong></span>
                      <strong style={{ color: barColor }}>{pct}%</strong>
                    </ProgLabel>
                    <ProgBar><div style={{ width: `${pct}%`, background: barColor }} /></ProgBar>
                    <ProgLabel style={{ marginTop: 6, marginBottom: 0 }}>
                      <span>Pendiente <strong style={{ color: a.saldoPendiente > 0 ? tokens.rose[600] : tokens.gray[400] }}>{formatCLP(a.saldoPendiente)}</strong></span>
                      <span>Meta {formatCLP(a.totalDeuda)}</span>
                    </ProgLabel>
                  </ProgressWrap>

                  <CardActions>
                    <ActionBtn $variant="primary" onClick={() => setDrawerAlumno(a)}>
                      <IcoEdit size={12} /> Gestionar pagos
                    </ActionBtn>
                    <Link href={`/dashboard/estudiantes/${a.id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <ActionBtn $variant="ghost" style={{ width: '100%' }}>
                        Ver ficha <IcoArrow size={12} />
                      </ActionBtn>
                    </Link>
                  </CardActions>
                </StudentCard>
              )
            })}
          </AnimatePresence>
        </Grid>
      ) : (
        <div style={{ background: '#fff', border: `1px solid ${tokens.gray[100]}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: tokens.gray[50] }}>
                {['Estudiante', 'Apoderados', 'Estado', 'Pagado', 'Pendiente', 'Progreso', ''].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700,
                    color: tokens.gray[400], textTransform: 'uppercase', letterSpacing: '.5px',
                    borderBottom: `1px solid ${tokens.gray[100]}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const pct = a.totalDeuda > 0 ? Math.round((a.totalPagado / a.totalDeuda) * 100) : 0
                const barColor = a.estadoGeneral === 'paid' ? tokens.emerald[500]
                  : a.estadoGeneral === 'partial' ? tokens.amber[500] : tokens.rose[400]
                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${tokens.gray[50]}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: tokens.gray[800] }}>{a.nombre}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: tokens.gray[500] }}>
                      {a.apoderados.filter(ap => ap !== 'N/A').join(', ') || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Pill $status={a.estadoGeneral}>{STATUS_LABELS[a.estadoGeneral]}</Pill>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: tokens.emerald[600] }}>{formatCLP(a.totalPagado)}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: a.saldoPendiente > 0 ? tokens.rose[600] : tokens.gray[400] }}>
                      {a.saldoPendiente > 0 ? formatCLP(a.saldoPendiente) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                        <div style={{ flex: 1, height: 5, background: tokens.gray[100], borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: barColor, minWidth: 30 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button onClick={() => setDrawerAlumno(a)} style={{
                        background: 'transparent', border: `1px solid ${tokens.gray[200]}`,
                        borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: tokens.gray[700],
                      }}>Gestionar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Empty>
          <IcoUsers size={42} />
          <p className="t">Sin resultados</p>
          <p className="s">Intenta con otro filtro o búsqueda</p>
        </Empty>
      )}

      {/* ── Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerAlumno && (
          <>
            <Backdrop
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerAlumno(null)} />
            <Drawer
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: .25 }}>
              <DrawerHead>
                <DrawerTitle>
                  <h3>{drawerAlumno.nombre}</h3>
                  <p>Marca cada item como pagado o pendiente</p>
                </DrawerTitle>
                <CloseBtn onClick={() => setDrawerAlumno(null)} title="Cerrar"><IcoClose size={16} /></CloseBtn>
              </DrawerHead>
              <DrawerBody>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                  marginBottom: 16, padding: 14, borderRadius: 11,
                  background: tokens.gray[50], border: `1px solid ${tokens.gray[100]}`,
                }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: tokens.gray[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Pagado</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: tokens.emerald[600], marginTop: 3 }}>{formatCLP(drawerAlumno.totalPagado)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: tokens.gray[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Pendiente</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: drawerAlumno.saldoPendiente > 0 ? tokens.rose[600] : tokens.gray[400], marginTop: 3 }}>
                      {formatCLP(drawerAlumno.saldoPendiente)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: tokens.gray[400], fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>Meta</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: tokens.gray[800], marginTop: 3 }}>{formatCLP(drawerAlumno.totalDeuda)}</div>
                  </div>
                </div>

                {drawerAlumno.tallaPoleron && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    background: TEAL + '0d', border: `1px solid ${TEAL}33`, borderRadius: 9,
                    fontSize: 12, color: tokens.gray[700], marginBottom: 14,
                  }}>
                    <IcoShirt size={13} color={TEAL} />
                    Polerón talla <strong>{drawerAlumno.tallaPoleron.nombre}</strong> · {formatCLP(drawerAlumno.tallaPoleron.valor)}
                  </div>
                )}

                <div style={{ fontSize: 10.5, fontWeight: 700, color: tokens.gray[400],
                  textTransform: 'uppercase', letterSpacing: '.6px', margin: '6px 0 8px' }}>
                  Items
                </div>

                {itemsConEstado.map(it => (
                  <ItemRow key={it.id} $paid={it.estado === 'paid'} $partial={it.estado === 'partial'}>
                    <ItemCheck
                      $paid={it.estado === 'paid'}
                      disabled={savingItemId === it.id}
                      onClick={() => togglePaid(it.id, it.estado === 'paid')}
                      title={it.estado === 'paid' ? 'Desmarcar como pagado' : 'Marcar como pagado'}
                    >
                      {savingItemId === it.id
                        ? <IcoSpinner size={12} />
                        : it.estado === 'paid' ? <IcoCheck size={13} strokeWidth={3} /> : null}
                    </ItemCheck>
                    <ItemMeta>
                      <div className="name">{it.nombre}</div>
                      <div className="sub">
                        {it.estado === 'paid'    && 'Pagado completo'}
                        {it.estado === 'partial' && `Parcial · falta ${formatCLP(it.pendiente)}`}
                        {it.estado === 'pending' && 'Sin pagos'}
                      </div>
                    </ItemMeta>
                    <ItemAmount $paid={it.estado === 'paid'}>
                      <div className="amt">{formatCLP(it.valor)}</div>
                      <div className="pct">
                        {it.valor > 0 ? Math.round((it.pagado / it.valor) * 100) : 0}%
                      </div>
                    </ItemAmount>
                  </ItemRow>
                ))}

                <Link href={`/dashboard/estudiantes/${drawerAlumno.id}`} style={{ textDecoration: 'none' }}>
                  <ActionBtn $variant="ghost" style={{ width: '100%', marginTop: 14 }}>
                    Ver ficha completa con historial <IcoArrow size={12} />
                  </ActionBtn>
                </Link>
              </DrawerBody>
            </Drawer>
          </>
        )}
      </AnimatePresence>
    </Page>
  )
}
