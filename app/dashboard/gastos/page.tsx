'use client'

/**
 * /dashboard/gastos
 *
 * Página de balance de salidas del curso. Reemplaza al subflujo `/nuevo`.
 *
 *   - Header con totales consolidados (todos los meses) y total filtrado.
 *   - Filtros: mes (chips), búsqueda libre, categoría.
 *   - Botón "+ Nueva salida" abre modal con formulario completo:
 *       concepto, monto, fecha, beneficiario, categoría, método, glosa,
 *       comprobante opcional (img/pdf).
 *   - Tabla con detalle por movimiento, eliminar fila.
 *   - Botón "Reset total" (admin) para empezar de cero.
 *
 *   Considera que TODO el dinero está en MercadoPago. Cada gasto registrado
 *   aquí asume que sale de la cuenta MP (método por defecto: mp_transfer).
 */
import { useState, useMemo, useEffect } from 'react'
import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown, Plus, Search, Calendar, Trash2, Upload, X,
  CheckCircle2, AlertCircle, FileText, Filter, RotateCcw, Wallet,
} from 'lucide-react'
import { tokens } from '@/styles/theme'
import { formatCLP } from '@/lib/utils'

const ROSE = '#f43f5e'
const TEAL = '#22b2b2'

// ── Layout ────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 32px 36px; max-width: 1360px;
  @media (max-width: 768px) { padding: 16px; }
`
const Header = styled.div`
  display: flex; align-items: flex-end; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
  h1 { font-size: 20px; font-weight: 800; color: ${tokens.gray[900]}; letter-spacing: -.3px; }
  p  { color: ${tokens.gray[400]}; font-size: 13px; margin-top: 3px; }
`
const HeaderActions = styled.div`
  margin-left: auto; display: flex; gap: 8px; align-items: center;
`
const PrimaryBtn = styled.button`
  background: ${ROSE}; color: #fff; border: 0; padding: 10px 16px;
  border-radius: 10px; font-size: 13.5px; font-weight: 700;
  cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
  transition: background .15s;
  &:hover { background: #e11d48; }
`
const GhostBtn = styled.button`
  background: #fff; color: ${tokens.gray[600]}; border: 1px solid ${tokens.gray[200]};
  padding: 9px 14px; border-radius: 10px; font-size: 13px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  &:hover { background: ${tokens.gray[50]}; color: ${tokens.gray[800]}; }
`

const KPIGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
  margin-bottom: 22px;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: 1fr; }
`
const KPI = styled(motion.div)<{ accent?: string }>`
  background: #fff; border: 1px solid ${tokens.gray[100]};
  border-radius: 14px; padding: 18px 20px;
  border-left: 3px solid ${p => p.accent ?? tokens.gray[200]};
  .label { font-size: 11px; font-weight: 700; color: ${tokens.gray[400]};
           text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
  .value { font-size: 22px; font-weight: 800; color: ${tokens.gray[900]};
           letter-spacing: -.4px; line-height: 1; margin-bottom: 4px; }
  .sub   { font-size: 11.5px; color: ${tokens.gray[400]}; }
`

const FilterBar = styled.div`
  background: #fff; border: 1px solid ${tokens.gray[100]};
  border-radius: 14px; padding: 14px 16px; margin-bottom: 16px;
  display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
`
const SearchWrap = styled.div`
  position: relative; flex: 1; min-width: 220px;
  svg { position:absolute; left:11px; top:50%; transform:translateY(-50%);
        color: ${tokens.gray[400]}; pointer-events: none; }
  input {
    width: 100%; padding: 9px 12px 9px 36px; border: 1px solid ${tokens.gray[200]};
    border-radius: 9px; font-size: 13px; outline: none; background: #fff;
    &:focus { border-color: ${ROSE}; box-shadow: 0 0 0 3px ${ROSE}22; }
  }
`
const Chips = styled.div`
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
`
const Chip = styled.button<{ active?: boolean }>`
  background: ${p => p.active ? ROSE : tokens.gray[50]};
  color:      ${p => p.active ? '#fff' : tokens.gray[600]};
  border: 1px solid ${p => p.active ? ROSE : tokens.gray[200]};
  border-radius: 99px; padding: 6px 12px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .15s;
  &:hover { background: ${p => p.active ? '#e11d48' : tokens.gray[100]}; }
`

const Panel = styled.div`
  background: #fff; border: 1px solid ${tokens.gray[100]};
  border-radius: 14px; padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.03);
`

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 13px;
  th {
    text-align: left; padding: 9px 12px;
    color: ${tokens.gray[400]}; font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .6px;
    border-bottom: 1px solid ${tokens.gray[100]};
  }
  td {
    padding: 11px 12px; color: ${tokens.gray[700]};
    border-bottom: 1px solid ${tokens.gray[50]};
    vertical-align: top;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: ${tokens.gray[50]}; }
`

const RowActions = styled.div`
  display: flex; gap: 6px; justify-content: flex-end;
`
const IconBtn = styled.button<{ danger?: boolean }>`
  background: transparent; border: 0; padding: 6px; border-radius: 6px;
  cursor: pointer; color: ${p => p.danger ? ROSE : tokens.gray[400]};
  &:hover { background: ${p => p.danger ? '#fee2e2' : tokens.gray[100]}; }
`

const EmptyState = styled.div`
  padding: 60px 20px; text-align: center; color: ${tokens.gray[400]};
  svg { margin-bottom: 14px; opacity: .5; }
  p { font-size: 13.5px; margin-bottom: 14px; }
`

// ── Modal ─────────────────────────────────────────────────────────────
const Backdrop = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(15,23,42,.55);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`
const ModalBox = styled(motion.div)`
  background: #fff; border-radius: 16px; max-width: 640px; width: 100%;
  max-height: 92vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,.25);
`
const ModalHead = styled.div`
  padding: 18px 22px; border-bottom: 1px solid ${tokens.gray[100]};
  display: flex; align-items: center; gap: 12px;
  h3 { font-size: 16px; font-weight: 800; color: ${tokens.gray[900]}; flex: 1; }
`
const ModalBody = styled.div`
  padding: 20px 22px; overflow-y: auto; flex: 1;
`
const ModalFoot = styled.div`
  padding: 14px 22px; border-top: 1px solid ${tokens.gray[100]};
  display: flex; gap: 10px; justify-content: flex-end; background: ${tokens.gray[50]};
`

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 540px) { grid-template-columns: 1fr; }
`
const Field = styled.div<{ full?: boolean }>`
  ${p => p.full ? 'grid-column: 1 / -1;' : ''}
  label {
    display: block; font-size: 11.5px; font-weight: 700;
    color: ${tokens.gray[600]}; text-transform: uppercase;
    letter-spacing: .5px; margin-bottom: 6px;
  }
  input, select, textarea {
    width: 100%; padding: 9px 12px; border: 1px solid ${tokens.gray[200]};
    border-radius: 9px; font-size: 13.5px; outline: none; box-sizing: border-box;
    font-family: inherit; background: #fff;
    &:focus { border-color: ${ROSE}; box-shadow: 0 0 0 3px ${ROSE}22; }
  }
  textarea { resize: vertical; min-height: 60px; }
  .err { font-size: 11px; color: ${ROSE}; margin-top: 4px; display: block; }
`
const UploadZone = styled.label<{ hasFile: boolean }>`
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border-radius: 9px; cursor: pointer;
  border: 1.5px dashed ${p => p.hasFile ? '#10b981' : tokens.gray[200]};
  background: ${p => p.hasFile ? '#10b98108' : tokens.gray[50]};
  font-size: 12.5px; color: ${tokens.gray[500]};
  transition: all .15s;
  &:hover { border-color: ${ROSE}; background: ${ROSE}08; color: ${tokens.gray[700]}; }
  input { display: none; }
`

// ── Helpers ───────────────────────────────────────────────────────────
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
}
function fmtMesLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month:'short', year:'numeric' })
}

const CATEGORIAS = ['Material', 'Aula', 'Premios', 'Eventos', 'Servicios', 'Comida', 'Otros']
const METODOS_PAGO = [
  { v: 'mp_transfer', l: 'Transferencia desde MP' },
  { v: 'efectivo',    l: 'Efectivo' },
  { v: 'tarjeta',     l: 'Tarjeta' },
  { v: 'otro',        l: 'Otro' },
]

interface Gasto {
  id: number
  nombre: string
  monto: number
  fecha: string
  emisor: string
  beneficiario: string
  categoria: string
  metodoPago: string
  descripcion: string
  comprobante: string | null
}

interface ApiResp {
  items: Gasto[]
  filtro: { mes: string|null; q: string|null; categoria: string|null; cantidad: number; total: number }
  consolidado: {
    total: number
    cantidad: number
    meses: { mes: string; total: number; cantidad: number }[]
    categorias: { nombre: string; total: number; cantidad: number }[]
  }
}

// ════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════
export default function GastosPage() {
  const [mes, setMes] = useState<string | null>(null)
  const [q,   setQ]   = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Debounce búsqueda
  const [qDeb, setQDeb] = useState('')
  useEffect(() => {
    const id = setTimeout(() => setQDeb(q), 300)
    return () => clearTimeout(id)
  }, [q])

  const url = useMemo(() => {
    const p = new URLSearchParams()
    if (mes) p.set('mes', mes)
    if (qDeb) p.set('q', qDeb)
    if (cat) p.set('categoria', cat)
    const qs = p.toString()
    return `/api/gastos${qs ? `?${qs}` : ''}`
  }, [mes, qDeb, cat])

  const { data, mutate, isLoading } = useFetch<ApiResp>(url, { refreshInterval: 15000 })

  const items       = data?.items ?? []
  const consolidado = data?.consolidado
  const filtro      = data?.filtro

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta salida?')) return
    await fetch(`/api/gastos?id=${id}`, { method: 'DELETE' })
    mutate()
  }

  const handleResetAll = async () => {
    const cantidad = consolidado?.cantidad ?? 0
    if (cantidad === 0) return
    if (!confirm(`Esto eliminará TODAS las ${cantidad} salidas registradas. Esta acción no se puede deshacer. ¿Continuar?`)) return
    if (!confirm('Última confirmación: ¿estás absolutamente seguro?')) return
    const r = await fetch('/api/gastos?all=true', { method: 'DELETE' })
    const j = await r.json()
    if (!r.ok) { alert(j.error ?? 'Error'); return }
    alert(`${j.eliminados} salidas eliminadas. Empezamos de cero.`)
    mutate()
  }

  return (
    <Page>
      <Header>
        <div>
          <h1>Salidas · Balance del curso</h1>
          <p>Registro consolidado de todas las transferencias y gastos. Todo el dinero está en MercadoPago.</p>
        </div>
        <HeaderActions>
          {(consolidado?.cantidad ?? 0) > 0 && (
            <GhostBtn onClick={handleResetAll} title="Eliminar todas las salidas (admin)">
              <RotateCcw size={13} /> Reset total
            </GhostBtn>
          )}
          <PrimaryBtn onClick={() => setShowModal(true)}>
            <Plus size={15} /> Nueva salida
          </PrimaryBtn>
        </HeaderActions>
      </Header>

      {/* KPIs consolidados */}
      <KPIGrid>
        <KPI accent={ROSE} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
          <div className="label">Total salidas (todo)</div>
          <div className="value">{formatCLP(consolidado?.total ?? 0)}</div>
          <div className="sub">{consolidado?.cantidad ?? 0} movimientos</div>
        </KPI>
        <KPI accent={TEAL} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.05}}>
          <div className="label">Total filtrado</div>
          <div className="value">{formatCLP(filtro?.total ?? 0)}</div>
          <div className="sub">
            {filtro?.cantidad ?? 0} salidas
            {(mes || qDeb || cat) && ' · con filtros'}
          </div>
        </KPI>
        <KPI accent="#10b981" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.1}}>
          <div className="label">Categorías</div>
          <div className="value">{consolidado?.categorias.length ?? 0}</div>
          <div className="sub">
            {consolidado?.categorias[0]
              ? `${consolidado.categorias[0].nombre}: ${formatCLP(consolidado.categorias[0].total)}`
              : '—'}
          </div>
        </KPI>
        <KPI accent="#8098f9" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:.15}}>
          <div className="label">Meses con movimiento</div>
          <div className="value">{consolidado?.meses.length ?? 0}</div>
          <div className="sub">
            {consolidado?.meses[0]
              ? `${fmtMesLabel(consolidado.meses[0].mes)}: ${formatCLP(consolidado.meses[0].total)}`
              : '—'}
          </div>
        </KPI>
      </KPIGrid>

      {/* Filtros */}
      <FilterBar>
        <SearchWrap>
          <Search size={14} />
          <input
            placeholder="Buscar concepto, beneficiario, glosa…"
            value={q} onChange={e => setQ(e.target.value)}
          />
        </SearchWrap>
        <Filter size={14} color={tokens.gray[400]} />
        <Chips>
          <Chip active={mes === null} onClick={() => setMes(null)}>Todos los meses</Chip>
          {consolidado?.meses.slice(0, 12).map(m => (
            <Chip key={m.mes} active={mes === m.mes} onClick={() => setMes(m.mes)}>
              {fmtMesLabel(m.mes)} · {formatCLP(m.total)}
            </Chip>
          ))}
        </Chips>
        {consolidado && consolidado.categorias.length > 0 && (
          <>
            <span style={{ width:1, height:20, background:tokens.gray[200] }} />
            <Chips>
              <Chip active={cat === null} onClick={() => setCat(null)}>Todas categorías</Chip>
              {consolidado.categorias.slice(0, 8).map(c => (
                <Chip key={c.nombre} active={cat === c.nombre} onClick={() => setCat(c.nombre)}>
                  {c.nombre} ({c.cantidad})
                </Chip>
              ))}
            </Chips>
          </>
        )}
      </FilterBar>

      {/* Tabla */}
      <Panel>
        {isLoading ? (
          <div style={{ padding: 30, textAlign: 'center', color: tokens.gray[400] }}>Cargando…</div>
        ) : items.length === 0 ? (
          <EmptyState>
            <TrendingDown size={42} />
            <p>
              {consolidado?.cantidad === 0
                ? 'Aún no hay salidas registradas. Empieza con "+ Nueva salida".'
                : 'Sin resultados con los filtros actuales.'}
            </p>
            {consolidado?.cantidad === 0 && (
              <PrimaryBtn onClick={() => setShowModal(true)}>
                <Plus size={14} /> Registrar primera salida
              </PrimaryBtn>
            )}
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ width: 100 }}>Fecha</th>
                <th>Concepto / glosa</th>
                <th>Beneficiario</th>
                <th>Categoría</th>
                <th>Método</th>
                <th>Comp.</th>
                <th style={{ textAlign:'right' }}>Monto</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map(g => (
                <tr key={g.id}>
                  <td style={{ fontSize: 12, color: tokens.gray[500], whiteSpace: 'nowrap' }}>
                    {formatFecha(g.fecha)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: tokens.gray[800], fontSize: 13 }}>
                      {g.nombre}
                    </div>
                    {g.descripcion && (
                      <div style={{ fontSize: 11.5, color: tokens.gray[400], marginTop: 2 }}>
                        {g.descripcion}
                      </div>
                    )}
                    <div style={{ fontSize: 10.5, color: tokens.gray[400], marginTop: 2 }}>
                      Emisor: {g.emisor}
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>
                    {g.beneficiario || <span style={{ color: tokens.gray[300] }}>—</span>}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                      background: tokens.gray[100], color: tokens.gray[600],
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {g.categoria}
                    </span>
                  </td>
                  <td style={{ fontSize: 11.5, color: tokens.gray[500] }}>
                    {METODOS_PAGO.find(m => m.v === g.metodoPago)?.l ?? g.metodoPago}
                  </td>
                  <td>
                    {g.comprobante ? (
                      <a href={g.comprobante} target="_blank" rel="noopener noreferrer"
                         style={{ color: TEAL, fontSize: 11.5, fontWeight: 600 }}>
                        Ver
                      </a>
                    ) : (
                      <span style={{ color: tokens.gray[300], fontSize: 11.5 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: ROSE, fontSize: 13.5 }}>
                    −{formatCLP(g.monto)}
                  </td>
                  <td>
                    <RowActions>
                      <IconBtn danger onClick={() => handleDelete(g.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </IconBtn>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {/* Modal nueva salida */}
      <AnimatePresence>
        {showModal && (
          <NuevaSalidaModal
            onClose={() => setShowModal(false)}
            onCreated={() => { setShowModal(false); mutate() }}
          />
        )}
      </AnimatePresence>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// MODAL: nueva salida
// ════════════════════════════════════════════════════════════════════
function NuevaSalidaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const today = new Date().toISOString().slice(0, 10)

  const [nombre, setNombre]             = useState('')
  const [montoRaw, setMontoRaw]         = useState('')
  const [fecha, setFecha]               = useState(today)
  const [emisor, setEmisor]             = useState('Tesorería MP')
  const [beneficiario, setBeneficiario] = useState('')
  const [categoria, setCategoria]       = useState('Otros')
  const [metodoPago, setMetodoPago]     = useState('mp_transfer')
  const [descripcion, setDescripcion]   = useState('')
  const [file, setFile]                 = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr]               = useState<string | null>(null)

  const monto = Number((montoRaw || '0').replace(/\D/g, ''))
  const valid = nombre.trim().length >= 2 && monto > 0 && fecha

  const formatMonto = (v: string) => {
    const n = v.replace(/\D/g, '')
    return n ? Number(n).toLocaleString('es-CL') : ''
  }

  const submit = async () => {
    if (!valid) return
    setSubmitting(true); setErr(null)
    try {
      // Validar fecha en formato YYYY-MM-DD y construir ISO sin TZ shift
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
      if (!m) { setErr('Fecha inválida'); setSubmitting(false); return }
      const fechaIso = `${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z`

      const fd = new FormData()
      fd.append('nombre', nombre.trim())
      fd.append('monto', String(monto))
      fd.append('fecha', fechaIso)
      fd.append('emisor', emisor.trim())
      fd.append('beneficiario', beneficiario.trim())
      fd.append('categoria', categoria)
      fd.append('metodoPago', metodoPago)
      fd.append('descripcion', descripcion.trim())
      if (file) fd.append('comprobante', file)

      const r = await fetch('/api/gastos', { method: 'POST', body: fd })
      const txt = await r.text()
      let j: any = null
      try { j = txt ? JSON.parse(txt) : null } catch { /* respuesta no-JSON */ }

      if (!r.ok) {
        setErr(j?.error ?? `HTTP ${r.status} · ${txt.slice(0, 120) || 'sin detalle'}`)
        return
      }
      onCreated()
    } catch (e: any) {
      setErr(e?.message ?? 'Error desconocido')
    } finally {
      setSubmitting(false)
    }
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
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: ROSE + '15', color: ROSE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingDown size={18} />
          </div>
          <h3>Registrar nueva salida</h3>
          <IconBtn onClick={onClose}><X size={16} /></IconBtn>
        </ModalHead>

        <ModalBody>
          <FormGrid>
            <Field full>
              <label>Concepto *</label>
              <input
                placeholder="Ej: Material didáctico, alquiler de aula…"
                value={nombre} onChange={e => setNombre(e.target.value)}
              />
            </Field>

            <Field>
              <label>Monto (CLP) *</label>
              <input
                placeholder="0"
                value={montoRaw}
                onChange={e => setMontoRaw(formatMonto(e.target.value))}
              />
              {monto > 0 && (
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: ROSE }}>
                  −{formatCLP(monto)}
                </div>
              )}
            </Field>

            <Field>
              <label>Fecha *</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} max={today} />
            </Field>

            <Field>
              <label>Emisor</label>
              <input
                placeholder="Tesorería MP"
                value={emisor} onChange={e => setEmisor(e.target.value)}
              />
            </Field>

            <Field>
              <label>Beneficiario</label>
              <input
                placeholder="A quién se transfirió"
                value={beneficiario} onChange={e => setBeneficiario(e.target.value)}
              />
            </Field>

            <Field>
              <label>Categoría</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field>
              <label>Método de pago</label>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}>
                {METODOS_PAGO.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </Field>

            <Field full>
              <label>Glosa / descripción (opcional)</label>
              <textarea
                placeholder="Detalle de la transferencia, número de operación, observaciones…"
                value={descripcion} onChange={e => setDescripcion(e.target.value)}
              />
            </Field>

            <Field full>
              <label>Comprobante (opcional · PNG/JPG/PDF · máx 5MB)</label>
              <UploadZone htmlFor="gasto-file" hasFile={!!file}>
                <input
                  id="gasto-file" type="file" accept="image/*,.pdf"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <><CheckCircle2 size={16} color="#10b981" /> {file.name}</>
                ) : (
                  <><Upload size={16} /> Adjuntar archivo</>
                )}
              </UploadZone>
            </Field>
          </FormGrid>

          {err && (
            <div style={{
              marginTop: 14, padding: '10px 14px', borderRadius: 9,
              background: '#fee2e2', color: '#991b1b', fontSize: 12.5,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <AlertCircle size={14} /> {err}
            </div>
          )}
        </ModalBody>

        <ModalFoot>
          <GhostBtn onClick={onClose} disabled={submitting}>Cancelar</GhostBtn>
          <PrimaryBtn onClick={submit} disabled={!valid || submitting}>
            {submitting ? 'Guardando…' : <><Plus size={14} /> Registrar salida</>}
          </PrimaryBtn>
        </ModalFoot>
      </ModalBox>
    </Backdrop>
  )
}
