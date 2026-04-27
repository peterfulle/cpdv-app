'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// ── Animations ──────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { opacity: .2; transform: scale(1); }
  50%       { opacity: .45; transform: scale(1.08); }
`
const spin = keyframes`to { transform: rotate(360deg); }`
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`

// ── Brand ────────────────────────────────────────────────────────────
const TEAL      = '#22b2b2'
const TEAL_DARK = '#1a9090'
const BG1       = '#041010'
const BG2       = '#061515'
const BG3       = '#091c1c'
const GLASS     = 'rgba(255,255,255,.04)'
const BORDER    = 'rgba(34,178,178,.15)'

// ── Styled components ────────────────────────────────────────────────
const PageWrap = styled.div`
  min-height: 100vh;
  background: linear-gradient(150deg, ${BG1} 0%, ${BG2} 50%, ${BG3} 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 16px 60px;
  position: relative;
  overflow-x: hidden;
  @media (max-width: 600px) { padding: 28px 12px 50px; }
`

const Blob = styled.div<{ top: string; left: string; size: string; delay?: string }>`
  position: fixed;
  top: ${p => p.top};
  left: ${p => p.left};
  width: ${p => p.size};
  height: ${p => p.size};
  background: radial-gradient(circle, ${TEAL} 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(100px);
  opacity: .2;
  animation: ${pulse} 8s ease-in-out infinite;
  animation-delay: ${p => p.delay ?? '0s'};
  pointer-events: none;
  z-index: 0;
`

const ContentCol = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`

const GlassCard = styled(motion.div)`
  width: 100%;
  background: ${GLASS};
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid ${BORDER};
  border-radius: 24px;
  padding: 36px 32px 32px;
  box-shadow: 0 0 0 1px rgba(34,178,178,.06), 0 40px 80px -16px rgba(0,0,0,.7);
  @media (max-width: 480px) { padding: 28px 20px 24px; }
`

const LogoWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
`

const LogoCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 3px rgba(34,178,178,.3), 0 8px 32px rgba(34,178,178,.25);
  flex-shrink: 0;
`

const AppTitle = styled.h1`
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -.4px;
  line-height: 1.2;
  margin: 0;
`

const AppSubtitle = styled.p`
  text-align: center;
  font-size: 13px;
  color: ${TEAL};
  margin: 0;
  font-weight: 500;
  letter-spacing: .2px;
`

const Label = styled.label`
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: rgba(255,255,255,.55);
  text-transform: uppercase;
  letter-spacing: .7px;
  margin-bottom: 6px;
`

const InputWrap = styled.div`
  position: relative;
  margin-bottom: 14px;
`

const IconLeft = styled.span`
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255,255,255,.28);
  display: flex;
  pointer-events: none;
`

const ToggleBtn = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.35);
  display: flex;
  padding: 4px;
  &:hover { color: rgba(255,255,255,.7); }
`

const StyledInput = styled.input<{ $pr?: boolean }>`
  width: 100%;
  padding: 12px 13px 12px 40px;
  padding-right: ${p => p.$pr ? '40px' : '13px'};
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 15px;
  outline: none;
  box-sizing: border-box;
  transition: border-color .2s, background .2s, box-shadow .2s;
  &::placeholder { color: rgba(255,255,255,.25); }
  &:focus {
    border-color: ${TEAL};
    background: rgba(34,178,178,.07);
    box-shadow: 0 0 0 3px rgba(34,178,178,.18);
  }
`

const AlertBox = styled(motion.div)<{ $variant: 'error' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px;
  background: ${p => p.$variant === 'error' ? 'rgba(244,63,94,.1)' : 'rgba(34,178,178,.1)'};
  border: 1px solid ${p => p.$variant === 'error' ? 'rgba(244,63,94,.28)' : 'rgba(34,178,178,.28)'};
  border-radius: 10px;
  color: ${p => p.$variant === 'error' ? '#fca5a5' : '#6ee7e7'};
  font-size: 13px;
  margin-bottom: 14px;
`

const LoginBtn = styled(motion.button)`
  width: 100%;
  padding: 13px;
  background: linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: .2px;
  box-shadow: 0 4px 20px rgba(34,178,178,.4);
  transition: box-shadow .2s;
  &:hover:not(:disabled) { box-shadow: 0 8px 28px rgba(34,178,178,.5); }
  &:disabled { opacity: .55; cursor: not-allowed; }
`

const Spinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  animation: ${spin} .8s linear infinite;
`

const PageFooter = styled.p`
  text-align: center;
  margin-top: 20px;
  color: rgba(255,255,255,.18);
  font-size: 11.5px;
`

const DividerRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  span {
    font-size: 12px;
    color: rgba(255,255,255,.22);
    white-space: nowrap;
  }
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,.08);
  }
`

const PayHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`

const PayHeaderIcon = styled.div`
  width: 40px;
  height: 40px;
  background: rgba(34,178,178,.15);
  border: 1px solid rgba(34,178,178,.25);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${TEAL};
`

const PayHeaderText = styled.div`
  h3 { font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 2px; }
  p  { font-size: 12px; color: rgba(255,255,255,.4); margin: 0; }
`

const SelectInput = styled.select`
  width: 100%;
  padding: 11px 36px 11px 14px;
  background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  box-sizing: border-box;
  transition: border-color .2s, box-shadow .2s;
  &:focus {
    border-color: ${TEAL};
    box-shadow: 0 0 0 3px rgba(34,178,178,.18);
  }
  option { background: #0a1a1a; color: #fff; }
`

const ItemsGrid = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
`

const ItemCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(34,178,178,.05);
  border: 1px solid rgba(34,178,178,.12);
  border-radius: 14px;
  border-left: 3px solid ${TEAL_DARK};
  animation: ${slideDown} .25s ease;
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`

const ItemInfo = styled.div`
  flex: 1;
  .cat {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: ${TEAL};
    background: rgba(34,178,178,.12);
    border: 1px solid rgba(34,178,178,.2);
    padding: 2px 8px;
    border-radius: 20px;
    margin-bottom: 5px;
  }
  .name  { font-size: 14px; font-weight: 600; color: rgba(255,255,255,.9); }
  .price { font-size: 15px; font-weight: 800; color: #fff; margin-top: 3px; }
`

const PayBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  background: linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 3px 12px rgba(34,178,178,.35);
  transition: box-shadow .2s, opacity .2s;
  flex-shrink: 0;
  &:hover:not(:disabled) { box-shadow: 0 5px 18px rgba(34,178,178,.5); }
  &:disabled { opacity: .5; cursor: not-allowed; }
  @media (max-width: 480px) { width: 100%; justify-content: center; }
`

const LoadingSpinner = styled.div`
  width: 28px;
  height: 28px;
  border: 2.5px solid rgba(34,178,178,.2);
  border-top-color: ${TEAL};
  border-radius: 50%;
  margin: 20px auto;
  animation: ${spin} .8s linear infinite;
`

const AllPaidBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(34,178,178,.08);
  border: 1px solid rgba(34,178,178,.22);
  border-radius: 12px;
  margin-top: 16px;
  font-size: 13.5px;
  font-weight: 600;
  color: #6ee7e7;
`

// ── Inline SVG icons ──────────────────────────────────────────────────
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function IconEye({ off }: { off?: boolean }) {
  if (off) return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}
function IconAlert() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function IconCreditCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  )
}
function IconArrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

// ── Types ─────────────────────────────────────────────────────────────
interface AlumnoSummary { id: number; nombre: string; pendientes: number }
interface PendingItem   { id: number; nombre: string; valor: number; categoria: string }

// ── Schema ────────────────────────────────────────────────────────────
const loginSchema = z.object({
  username: z.string().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
type LoginForm = z.infer<typeof loginSchema>

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

// ── Component ─────────────────────────────────────────────────────────
export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const mpStatus     = searchParams.get('mp')

  const [loginError, setLoginError] = useState('')
  const [showPass,   setShowPass]   = useState(false)

  // Public payment state
  const [alumnos,        setAlumnos]        = useState<AlumnoSummary[]>([])
  const [selectedId,     setSelectedId]     = useState<number | ''>('')
  const [pendingItems,   setPendingItems]   = useState<PendingItem[]>([])
  const [loadingAlumnos, setLoadingAlumnos] = useState(true)
  const [loadingItems,   setLoadingItems]   = useState(false)
  const [payingItemId,   setPayingItemId]   = useState<number | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // Fetch students with pending items on mount
  useEffect(() => {
    fetch('/api/public/cuotas')
      .then(r => r.json())
      .then(data => setAlumnos(data.alumnos ?? []))
      .catch(() => {})
      .finally(() => setLoadingAlumnos(false))
  }, [])

  // Fetch pending items when student changes
  useEffect(() => {
    if (!selectedId) { setPendingItems([]); return }
    setLoadingItems(true)
    fetch(`/api/public/cuotas?alumnoId=${selectedId}`)
      .then(r => r.json())
      .then(data => setPendingItems(data.items ?? []))
      .catch(() => setPendingItems([]))
      .finally(() => setLoadingItems(false))
  }, [selectedId])

  async function onSubmit(data: LoginForm) {
    setLoginError('')
    const result = await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setLoginError('Usuario y/o contraseña inválidos')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handlePagar = useCallback(async (itemId: number) => {
    if (!selectedId) return
    setPayingItemId(itemId)
    try {
      const res  = await fetch('/api/public/pagar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ alumnoId: Number(selectedId), itemId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear el pago')
      const url = data.sandboxUrl || data.checkoutUrl
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPayingItemId(null)
    }
  }, [selectedId])

  return (
    <PageWrap>
      {/* Background blobs */}
      <Blob top="-8%"  left="-5%"  size="420px" delay="0s"   />
      <Blob top="55%"  left="65%"  size="350px" delay="3s"   />
      <Blob top="20%"  left="40%"  size="280px" delay="5.5s" />

      <ContentCol>
        {/* ── Login card ──────────────────────────────────────────── */}
        <GlassCard
          initial={{ opacity: 0, y: 28, scale: .97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: .5, ease: [.16, 1, .3, 1] }}
        >
          <LogoWrap>
            <LogoCircle>
              <Image src="/logo-cpv.svg" alt="CPV Peñalolén" width={80} height={80} priority />
            </LogoCircle>
            <div>
              <AppTitle>Acceso al Sistema</AppTitle>
              <AppSubtitle>2°A CPV Peñalolén · Tesorería 2026</AppSubtitle>
            </div>
          </LogoWrap>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <AnimatePresence mode="wait">
              {mpStatus === 'ok' && (
                <AlertBox key="ok" $variant="success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <IconCheck /> Pago procesado. Será confirmado en breve.
                </AlertBox>
              )}
              {mpStatus === 'pending' && (
                <AlertBox key="pend" $variant="success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <IconAlert /> Pago en revisión. Te notificaremos al confirmarse.
                </AlertBox>
              )}
              {(loginError || errors.username || errors.password) && (
                <AlertBox key="err" $variant="error" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <IconAlert />
                  {loginError || errors.username?.message || errors.password?.message}
                </AlertBox>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="username">Usuario</Label>
              <InputWrap>
                <IconLeft><IconUser /></IconLeft>
                <StyledInput id="username" placeholder="Ej: tesorero" autoComplete="username" {...register('username')} />
              </InputWrap>
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <InputWrap>
                <IconLeft><IconLock /></IconLeft>
                <StyledInput
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  $pr
                  {...register('password')}
                />
                <ToggleBtn type="button" onClick={() => setShowPass(v => !v)}>
                  <IconEye off={showPass} />
                </ToggleBtn>
              </InputWrap>
            </div>

            <LoginBtn type="submit" disabled={isSubmitting} whileTap={{ scale: .98 }}>
              {isSubmitting
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Spinner /> Ingresando...</span>
                : 'Ingresar al sistema'}
            </LoginBtn>
          </form>

          <PageFooter>© {new Date().getFullYear()} CPV Peñalolén · Sistema de Tesorería</PageFooter>
        </GlassCard>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <DividerRow><span>ó paga sin iniciar sesión</span></DividerRow>

        {/* ── Public payment card ──────────────────────────────────── */}
        <GlassCard
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .5, delay: .15, ease: [.16, 1, .3, 1] }}
        >
          <PayHeader>
            <PayHeaderIcon><IconCreditCard /></PayHeaderIcon>
            <PayHeaderText>
              <h3>Pagar mi cuota</h3>
              <p>Sin necesidad de iniciar sesión</p>
            </PayHeaderText>
          </PayHeader>

          {loadingAlumnos ? (
            <LoadingSpinner />
          ) : alumnos.length === 0 ? (
            <AllPaidBadge>
              <IconCheck /> ¡Todos al día! No hay cuotas pendientes.
            </AllPaidBadge>
          ) : (
            <>
              <Label htmlFor="alumno-select">Busca tu nombre</Label>
              <SelectInput
                id="alumno-select"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">— Selecciona un alumno —</option>
                {alumnos.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.pendientes} pendiente{a.pendientes !== 1 ? 's' : ''})
                  </option>
                ))}
              </SelectInput>

              {selectedId !== '' && (
                loadingItems ? (
                  <LoadingSpinner />
                ) : pendingItems.length === 0 ? (
                  <AllPaidBadge>
                    <IconCheck />
                    ¡{alumnos.find(a => a.id === selectedId)?.nombre?.split(' ')[0]} está al día!
                  </AllPaidBadge>
                ) : (
                  <ItemsGrid initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3 }}>
                    {pendingItems.map(item => (
                      <ItemCard key={item.id}>
                        <ItemInfo>
                          <div className="cat">{item.categoria}</div>
                          <div className="name">{item.nombre}</div>
                          <div className="price">{formatCLP(item.valor)}</div>
                        </ItemInfo>
                        <PayBtn onClick={() => handlePagar(item.id)} disabled={payingItemId === item.id}>
                          {payingItemId === item.id
                            ? <><Spinner style={{ width:14, height:14 } as React.CSSProperties} /> Creando...</>
                            : <>Pagar <IconArrow /></>}
                        </PayBtn>
                      </ItemCard>
                    ))}
                  </ItemsGrid>
                )
              )}
            </>
          )}
        </GlassCard>
      </ContentCol>
    </PageWrap>
  )
}

