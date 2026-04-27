'use client'

import { useFetch } from '@/lib/useFetch'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { tokens } from '@/styles/theme'
import { formatCLP } from '@/lib/utils'

// ── Tipos ─────────────────────────────────────────────────────────────
interface Alumno { id: number; nombre: string }
interface Item   { id: number; nombre: string; valor: number }
interface Transaccion {
  id: number; preferenceId: string; paymentId: string | null
  status: string; statusDetail: string | null
  monto: number; externalRef: string; checkoutUrl: string
  createdAt: string; updatedAt: string
  alumno: { id: number; nombre: string }
  item:   { id: number; nombre: string; valor: number }
  pago:   { id: number; fecha: string } | null
}

// ── SVG icons ─────────────────────────────────────────────────────────
type SvgProps = { size?: number; color?: string; style?: React.CSSProperties }

const IcoLink = ({ size = 16, color = 'currentColor' }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IcoSync = ({ size = 16, color = 'currentColor', style }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
)
const IcoCopy = ({ size = 16, color = 'currentColor' }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IcoCheck = ({ size = 16, color = 'currentColor' }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcoExternal = ({ size = 14, color = 'currentColor' }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)
const IcoMP = ({ size = 20 }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="10" fill="#009EE3"/>
    <path d="M8 20c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="14" cy="22" r="3" fill="#fff"/>
    <circle cx="20" cy="26" r="3" fill="#fff"/>
    <circle cx="26" cy="22" r="3" fill="#fff"/>
  </svg>
)
const IcoWallet = ({ size = 16, color = 'currentColor' }: SvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
  </svg>
)

// ── Styled ─────────────────────────────────────────────────────────────
const Page = styled.div`
  padding: 28px 32px;
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

const Title = styled.h1`
  font-size: 22px;
  font-weight: 800;
  color: ${tokens.gray[900]};
  letter-spacing: -.4px;
  display: flex;
  align-items: center;
  gap: 10px;
`

const Sub = styled.p`
  font-size: 13px;
  color: ${tokens.gray[500]};
  margin-top: 4px;
`

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`

const Card = styled(motion.div)`
  background: #fff;
  border: 1px solid ${tokens.gray[100]};
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
`

const CardTitle = styled.h2`
  font-size: 14px;
  font-weight: 700;
  color: ${tokens.gray[800]};
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`

const FormGroup = styled.div`
  margin-bottom: 14px;
`

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: ${tokens.gray[600]};
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: .5px;
`

const Select = styled.select`
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid ${tokens.gray[200]};
  border-radius: 9px;
  font-size: 13.5px;
  color: ${tokens.gray[800]};
  background: #fff;
  cursor: pointer;
  transition: border-color .15s;
  appearance: none;
  &:focus { outline: none; border-color: ${tokens.brand[400]}; }
`

const Btn = styled.button<{ $variant?: 'primary' | 'secondary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  border: none;

  ${p => (!p.$variant || p.$variant === 'primary') && `
    background: #009EE3;
    color: #fff;
    &:hover { background: #007bb5; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  `}
  ${p => p.$variant === 'secondary' && `
    background: ${tokens.gray[100]};
    color: ${tokens.gray[700]};
    border: 1px solid ${tokens.gray[200]};
    &:hover { background: ${tokens.gray[200]}; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  `}
  ${p => p.$variant === 'ghost' && `
    background: transparent;
    color: ${tokens.gray[500]};
    padding: 6px 10px;
    &:hover { background: ${tokens.gray[50]}; color: ${tokens.gray[700]}; }
  `}
`

const ResultBox = styled(motion.div)<{ $success: boolean }>`
  margin-top: 14px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${p => p.$success ? 'rgba(0,158,227,.3)' : 'rgba(251,113,133,.3)'};
  background: ${p => p.$success ? 'rgba(0,158,227,.05)' : 'rgba(251,113,133,.05)'};
`

const LinkDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${tokens.gray[50]};
  border: 1px solid ${tokens.gray[200]};
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 10px;
`

const LinkText = styled.span`
  flex: 1;
  font-size: 12px;
  color: ${tokens.brand[600]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const CopyBtn = styled.button<{ $copied: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
  background: ${p => p.$copied ? 'rgba(16,185,129,.12)' : tokens.gray[100]};
  color: ${p => p.$copied ? '#059669' : tokens.gray[600]};
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  ${p => {
    const s = p.$status
    if (s === 'approved')   return 'background:rgba(16,185,129,.12); color:#065f46; border:1px solid rgba(16,185,129,.25);'
    if (s === 'pending')    return 'background:rgba(251,191,36,.12); color:#92400e; border:1px solid rgba(251,191,36,.3);'
    if (s === 'in_process') return 'background:rgba(97,114,243,.1); color:#3337a7; border:1px solid rgba(97,114,243,.2);'
    return 'background:rgba(156,163,175,.1); color:#4b5563; border:1px solid rgba(156,163,175,.2);'
  }}
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`

const Th = styled.th`
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: ${tokens.gray[400]};
  padding: 0 12px 10px;
  white-space: nowrap;
  &:first-of-type { padding-left: 0; }
`

const Td = styled.td`
  padding: 11px 12px;
  color: ${tokens.gray[700]};
  border-top: 1px solid ${tokens.gray[50]};
  vertical-align: middle;
  &:first-of-type { padding-left: 0; }
`

const Empty = styled.div`
  text-align: center;
  padding: 48px 16px;
  color: ${tokens.gray[400]};
  font-size: 13px;
`

// ── Helpers ────────────────────────────────────────────────────────────
function statusLabel(s: string) {
  if (s === 'approved')   return 'Aprobado'
  if (s === 'pending')    return 'Pendiente'
  if (s === 'in_process') return 'Procesando'
  if (s === 'cancelled')  return 'Cancelado'
  if (s === 'refunded')   return 'Reembolsado'
  return s
}

// ── Component ──────────────────────────────────────────────────────────
export default function MercadoPagoPage() {
  // Datos para el formulario
  const { data: alumnosData } = useFetch<{ alumnos: { id: number; nombre: string }[] }>('/api/alumnos')
  const { data: itemsData }   = useFetch<{ items: Item[] }>('/api/items')

  // Transacciones MP
  const { data: txData, mutate: reloadTx } = useFetch<{ transacciones: Transaccion[] }>('/api/mercadopago/payments')

  const [alumnoId, setAlumnoId] = useState('')
  const [itemId,   setItemId]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [syncing,  setSyncing]  = useState(false)
  const [result,   setResult]   = useState<null | { checkoutUrl: string; sandboxUrl: string | null; alumno: string; item: string; monto: number }>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [copied,   setCopied]   = useState(false)

  const alumnos = alumnosData?.alumnos ?? []
  const items   = (itemsData as any)?.items ?? []

  async function handleGenerate() {
    if (!alumnoId || !itemId) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumnoId: Number(alumnoId), itemId: Number(itemId) }),
      })
      // Check ok BEFORE parsing json so HTML error bodies don't crash
      if (!res.ok) {
        let msg = `Error ${res.status}`
        try { const j = await res.json(); msg = j.error ?? msg } catch { /* ignore */ }
        setError(msg)
        return
      }
      const json = await res.json()
      setResult(json)
      reloadTx()
    } catch (err: any) {
      console.error('[MP generate]', err)
      setError(err?.message ?? 'Error de red. Revisa la consola.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/mercadopago/payments', { method: 'POST' })
      reloadTx()
    } finally {
      setSyncing(false)
    }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const transacciones = txData?.transacciones ?? []

  return (
    <Page>
      <PageHeader>
        <div>
          <Title>
            <IcoMP size={28} />
            MercadoPago
          </Title>
          <Sub>Genera links de pago y consulta el estado de transacciones en tiempo real</Sub>
        </div>
        <Btn $variant="secondary" onClick={handleSync} disabled={syncing}>
          <IcoSync size={14} style={syncing ? { animation: 'spin .9s linear infinite' } : {}} />
          {syncing ? 'Sincronizando…' : 'Sincronizar pagos'}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </Btn>
      </PageHeader>

      <Grid2>
        {/* ── Generador de link ── */}
        <Card
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .3 }}
        >
          <CardTitle>
            <IcoLink size={15} color="#009EE3" />
            Generar link de pago
          </CardTitle>

          <FormGroup>
            <Label>Alumno</Label>
            <Select value={alumnoId} onChange={e => setAlumnoId(e.target.value)}>
              <option value="">Seleccionar alumno…</option>
              {alumnos.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Concepto / Item</Label>
            <Select value={itemId} onChange={e => setItemId(e.target.value)}>
              <option value="">Seleccionar concepto…</option>
              {items.map((i: Item) => (
                <option key={i.id} value={i.id}>{i.nombre} — {formatCLP(i.valor)}</option>
              ))}
            </Select>
          </FormGroup>

          <Btn
            onClick={handleGenerate}
            disabled={!alumnoId || !itemId || loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            <IcoWallet size={15} color="#fff" />
            {loading ? 'Generando…' : 'Crear link de pago'}
          </Btn>

          <AnimatePresence>
            {result && (
              <ResultBox
                $success
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: '#007bb5' }}>
                  ✓ Link generado para {result.alumno}
                </p>
                <p style={{ fontSize: 12, color: tokens.gray[500], marginTop: 3 }}>
                  {result.item} · {formatCLP(result.monto)}
                </p>

                <LinkDisplay>
                  <IcoLink size={13} color={tokens.brand[400]} />
                  <LinkText>{result.checkoutUrl}</LinkText>
                  <CopyBtn $copied={copied} onClick={() => copyLink(result.checkoutUrl)}>
                    {copied ? <IcoCheck size={11} /> : <IcoCopy size={11} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </CopyBtn>
                </LinkDisplay>

                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <a href={result.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <Btn style={{ padding: '7px 14px', fontSize: 12 }}>
                      <IcoExternal size={12} color="#fff" />
                      Abrir link
                    </Btn>
                  </a>
                  {result.sandboxUrl && (
                    <a href={result.sandboxUrl} target="_blank" rel="noopener noreferrer">
                      <Btn $variant="secondary" style={{ padding: '7px 14px', fontSize: 12 }}>
                        <IcoExternal size={12} />
                        Sandbox (prueba)
                      </Btn>
                    </a>
                  )}
                </div>
              </ResultBox>
            )}
            {error && (
              <ResultBox
                $success={false}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: '#be123c' }}>Error: {error}</p>
              </ResultBox>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Transacciones ── */}
        <Card
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .3, delay: .05 }}
        >
          <CardTitle>
            <IcoWallet size={15} color={tokens.brand[500]} />
            Transacciones MercadoPago ({transacciones.length})
          </CardTitle>

          {transacciones.length === 0 ? (
            <Empty>
              <IcoMP size={36} />
              <p style={{ marginTop: 10 }}>Sin transacciones aún.<br />Genera el primer link de pago.</p>
            </Empty>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <thead>
                  <tr>
                    <Th>Alumno</Th>
                    <Th>Concepto</Th>
                    <Th>Monto</Th>
                    <Th>Estado</Th>
                    <Th>Fecha</Th>
                    <Th>Link</Th>
                  </tr>
                </thead>
                <tbody>
                  {transacciones.map(tx => (
                    <tr key={tx.id}>
                      <Td style={{ fontWeight: 600, color: tokens.gray[900] }}>{tx.alumno.nombre}</Td>
                      <Td style={{ color: tokens.gray[500] }}>{tx.item.nombre}</Td>
                      <Td style={{ fontWeight: 700, color: tokens.gray[800] }}>{formatCLP(tx.monto)}</Td>
                      <Td>
                        <StatusBadge $status={tx.status}>
                          {tx.status === 'approved' && <IcoCheck size={9} />}
                          {statusLabel(tx.status)}
                        </StatusBadge>
                        {tx.pago && (
                          <span style={{ fontSize: 10, color: tokens.emerald[600], display: 'block', marginTop: 2 }}>
                            ✓ Pago registrado #{tx.pago.id}
                          </span>
                        )}
                      </Td>
                      <Td style={{ fontSize: 12, color: tokens.gray[400] }}>
                        {new Date(tx.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                      </Td>
                      <Td>
                        <a href={tx.checkoutUrl} target="_blank" rel="noopener noreferrer">
                          <Btn $variant="ghost" style={{ padding: '4px 8px' }}>
                            <IcoExternal size={12} />
                          </Btn>
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </Grid2>
    </Page>
  )
}
