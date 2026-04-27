'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, CreditCard, TrendingDown,
  BarChart3, LogOut, Menu, X,
  PlusCircle, DollarSign, TrendingUp, ChevronRight, Shield, Activity, Wallet,
} from 'lucide-react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { getInitials } from '@/lib/utils'

// ── Design constants ──────────────────────────────────────────────────
const SIDEBAR_BG   = '#051212'
const SIDEBAR_BG2  = '#071a1a'
const TEAL         = '#22b2b2'
const TEAL_DARK    = '#1a9090'
const BORDER_COLOR = 'rgba(34,178,178,.1)'
const TEXT_MUTED   = 'rgba(255,255,255,.38)'
const TEXT_SUB     = 'rgba(255,255,255,.22)'

// ── Styled components ─────────────────────────────────────────────────
const SidebarWrap = styled(motion.nav)<{ $open: boolean }>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 256px;
  background: linear-gradient(180deg, ${SIDEBAR_BG} 0%, ${SIDEBAR_BG2} 100%);
  display: flex;
  flex-direction: column;
  z-index: 50;
  border-right: 1px solid ${BORDER_COLOR};

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    left: -60px;
    width: 240px;
    height: 240px;
    background: radial-gradient(circle, rgba(34,178,178,.14) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    transform: ${p => p.$open ? 'translateX(0)' : 'translateX(-100%)'};
    transition: transform .3s cubic-bezier(.16,1,.3,1);
  }
`

const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 18px 20px;
  border-bottom: 1px solid ${BORDER_COLOR};
  flex-shrink: 0;
`

const LogoCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 0 2px rgba(34,178,178,.35), 0 4px 16px rgba(34,178,178,.2);
  flex-shrink: 0;
`

const LogoText = styled.div`
  flex: 1;
  min-width: 0;
  h2 {
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -.3px;
    line-height: 1;
  }
`

const SchoolBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .5px;
  text-transform: uppercase;
  color: #5ecece;
  background: rgba(34,178,178,.12);
  border: 1px solid rgba(34,178,178,.22);
  border-radius: 4px;
  padding: 2px 6px;
  margin-top: 5px;
  width: fit-content;
`

const CloseBtn = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: ${TEXT_MUTED};
  display: none;
  padding: 6px;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  flex-shrink: 0;
  @media (max-width: 1024px) { display: flex; }
  &:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.8); }
`

const Nav = styled.div`
  flex: 1;
  padding: 10px 10px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

const SectionLabel = styled.p`
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: ${TEXT_SUB};
  padding: 14px 8px 5px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 8px;
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${BORDER_COLOR};
  }
`

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: ${p => p.$active ? '600' : '500'};
  color: ${p => p.$active ? '#ffffff' : TEXT_MUTED};
  background: ${p => p.$active ? 'linear-gradient(90deg,rgba(34,178,178,.18) 0%,rgba(34,178,178,.04) 100%)' : 'transparent'};
  border: 1px solid ${p => p.$active ? 'rgba(34,178,178,.25)' : 'transparent'};
  box-shadow: ${p => p.$active ? `inset 2.5px 0 0 ${TEAL}` : 'none'};
  text-decoration: none;
  transition: all .15s ease;
  cursor: pointer;

  &:hover {
    color: rgba(255,255,255,.9);
    background: rgba(255,255,255,.055);
    border-color: rgba(255,255,255,.07);
  }

  .nav-icon {
    flex-shrink: 0;
    opacity: ${p => p.$active ? 1 : 0.5};
    color: ${p => p.$active ? TEAL : 'inherit'};
    transition: opacity .15s, color .15s;
  }
  &:hover .nav-icon { opacity: .8; }
  .nav-label { flex: 1; }
  .nav-arrow {
    opacity: 0;
    transition: opacity .15s, transform .15s;
    color: ${TEXT_MUTED};
  }
  &:hover .nav-arrow { opacity: .7; transform: translateX(2px); }
`

const NavDivider = styled.div`
  height: 1px;
  background: ${BORDER_COLOR};
  margin: 8px 8px 4px;
`

const ActionItem = styled(Link)<{ $active: boolean; $color: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.$active ? '#fff' : 'rgba(255,255,255,.55)'};
  background: ${p => p.$active ? 'rgba(34,178,178,.12)' : 'rgba(255,255,255,.025)'};
  border: 1px solid ${p => p.$active ? 'rgba(34,178,178,.22)' : 'rgba(255,255,255,.06)'};
  text-decoration: none;
  transition: all .15s ease;
  cursor: pointer;
  &:hover {
    background: rgba(255,255,255,.06);
    border-color: rgba(255,255,255,.1);
    color: #fff;
  }
  .action-icon { color: ${p => p.$color}; flex-shrink: 0; opacity: .9; }
  .action-label { flex: 1; }
`

const UserFooter = styled.div`
  padding: 12px 10px 14px;
  border-top: 1px solid ${BORDER_COLOR};
  flex-shrink: 0;
`

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.07);
`

const AvatarWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const Avatar = styled.div`
  width: 34px;
  height: 34px;
  background: linear-gradient(135deg, #22b2b2, #1a7070);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -.5px;
`

const OnlineDot = styled.span`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  background: #34d399;
  border-radius: 50%;
  border: 1.5px solid ${SIDEBAR_BG2};
`

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  p {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1;
  }
`

const RoleBadge = styled.span<{ $admin: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  margin-top: 3px;
  color: ${p => p.$admin ? TEAL : '#34d399'};
`

const LogoutBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,.25);
  display: flex;
  padding: 6px;
  border-radius: 8px;
  transition: all .15s;
  flex-shrink: 0;
  &:hover { background: rgba(251,113,133,.12); color: #fb7185; }
`

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(6px);
  z-index: 40;
  display: none;
  @media (max-width: 1024px) { display: block; }
`

const MobileHeader = styled.div`
  display: none;
  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 56px;
    background: #051212;
    border-bottom: 1px solid rgba(34,178,178,.1);
    position: sticky;
    top: 0;
    z-index: 30;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
  }
`

const HamburgerBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #4b5563;
  display: flex;
  padding: 8px;
  border-radius: 8px;
  &:hover { background: #f3f4f6; }
`

// ── Config ────────────────────────────────────────────────────────────
const PRIMARY_ITEMS = [
  { href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/dashboard/analiticas',   label: 'Analíticas',   icon: BarChart3 },
  { href: '/dashboard/tiempo-real',  label: 'Tiempo Real',  icon: Activity },
]
const MANAGEMENT_ITEMS = [
  { href: '/dashboard/estudiantes',         label: 'Estudiantes',   icon: Users },
  { href: '/dashboard/pagos',               label: 'Pagos',         icon: CreditCard },
  { href: '/dashboard/gastos',              label: 'Gastos',        icon: TrendingDown },
  { href: '/dashboard/mercadopago',         label: 'MercadoPago',   icon: Wallet },
  { href: '/dashboard/mercadopago/fondo',   label: 'Fondo MP',      icon: TrendingUp },
]
const ACTION_ITEMS = [
  { href: '/dashboard/pagos/nuevo',    label: 'Ingresar Pago',   icon: PlusCircle, color: '#34d399' },
  { href: '/dashboard/ingresos/nuevo', label: 'Otro Ingreso',    icon: TrendingUp,  color: '#8098f9' },
  { href: '/dashboard/gastos/nuevo',   label: 'Registrar Gasto', icon: DollarSign,  color: '#fb7185' },
]

// ── Component ─────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const user    = session?.user as any
  const isAdmin = user?.nivel === 'Administrador'

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <>
      <MobileHeader>
        <HamburgerBtn onClick={() => setOpen(true)}>
          <Menu size={20} color="rgba(255,255,255,.7)" />
        </HamburgerBtn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 0 1.5px rgba(34,178,178,.4)' }}>
            <Image src="/logo-cpv.svg" alt="CPV" width={28} height={28} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>2°A CPV</span>
        </div>
        <div style={{ width: 36 }} />
      </MobileHeader>

      <AnimatePresence>
        {open && (
          <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <SidebarWrap $open={open}>

        <LogoArea>
          <LogoCircle>
            <Image src="/logo-cpv.svg" alt="CPV Peñalolén" width={40} height={40} />
          </LogoCircle>
          <LogoText>
            <h2>2°A CPV</h2>
            <SchoolBadge>
              <Shield size={8} />
              Tesorería 2026
            </SchoolBadge>
          </LogoText>
          <CloseBtn onClick={() => setOpen(false)}>
            <X size={17} />
          </CloseBtn>
        </LogoArea>

        <Nav>
          <SectionLabel>Principal</SectionLabel>
          {PRIMARY_ITEMS.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} $active={isActive(href)} onClick={() => setOpen(false)}>
              <Icon size={15} className="nav-icon" />
              <span className="nav-label">{label}</span>
              <ChevronRight size={13} className="nav-arrow" />
            </NavItem>
          ))}

          <SectionLabel>Gestión</SectionLabel>
          {MANAGEMENT_ITEMS.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} $active={isActive(href)} onClick={() => setOpen(false)}>
              <Icon size={15} className="nav-icon" />
              <span className="nav-label">{label}</span>
              <ChevronRight size={13} className="nav-arrow" />
            </NavItem>
          ))}

          <NavDivider />
          <SectionLabel>Acciones rápidas</SectionLabel>
          {ACTION_ITEMS.map(({ href, label, icon: Icon, color }) => (
            <ActionItem key={href} href={href} $active={isActive(href)} $color={color} onClick={() => setOpen(false)}>
              <Icon size={14} className="action-icon" />
              <span className="action-label">{label}</span>
            </ActionItem>
          ))}
        </Nav>

        <UserFooter>
          <UserCard>
            <AvatarWrap>
              <Avatar>{getInitials(user?.name ?? 'U')}</Avatar>
              <OnlineDot />
            </AvatarWrap>
            <UserInfo>
              <p>{user?.name ?? 'Usuario'}</p>
              <RoleBadge $admin={isAdmin}>
                {isAdmin && <Shield size={9} />}
                {user?.nivel ?? 'Usuario'}
              </RoleBadge>
            </UserInfo>
            <LogoutBtn onClick={() => signOut({ callbackUrl: '/login' })} title="Cerrar sesión">
              <LogOut size={15} />
            </LogoutBtn>
          </UserCard>
        </UserFooter>

      </SidebarWrap>
    </>
  )
}
