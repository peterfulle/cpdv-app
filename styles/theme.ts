import { css } from '@emotion/react'

// === Design tokens ===================================================
export const tokens = {
  brand: {
    50:  '#edfafa',
    100: '#d0f2f2',
    200: '#a5e4e4',
    300: '#6acece',
    400: '#3dbdbd',
    500: '#22b2b2',
    600: '#1a9090',
    700: '#167676',
    800: '#126060',
    900: '#0d4e4e',
  },
  emerald: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
  amber:   { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  rose:    { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
  gray: {
    50:  '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.04)',
    md: '0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px -2px rgba(0,0,0,.04)',
    lg: '0 10px 15px -3px rgba(0,0,0,.08), 0 4px 6px -4px rgba(0,0,0,.04)',
    glow: '0 0 0 3px rgba(97,114,243,.25)',
  },
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '20px', full: '9999px' },
  transition: {
    fast:   'all .15s ease',
    normal: 'all .25s ease',
    slow:   'all .4s cubic-bezier(.16,1,.3,1)',
  },
} as const

// === Shared component styles ==========================================
export const card = css`
  background: #ffffff;
  border: 1px solid ${tokens.gray[200]};
  border-radius: ${tokens.radius.lg};
  box-shadow: ${tokens.shadow.sm};
  transition: box-shadow .2s ease;
  &:hover { box-shadow: ${tokens.shadow.md}; }
`

export const kpiCard = css`
  ${card};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
`

export const badge = (color: 'green' | 'yellow' | 'red' | 'blue' | 'gray') => {
  const map = {
    green:  { bg: tokens.emerald[400] + '20', text: tokens.emerald[600], border: tokens.emerald[400] + '40' },
    yellow: { bg: tokens.amber[400]   + '20', text: tokens.amber[600],   border: tokens.amber[400]   + '40' },
    red:    { bg: tokens.rose[400]    + '20', text: tokens.rose[600],    border: tokens.rose[400]    + '40' },
    blue:   { bg: tokens.brand[400]   + '20', text: tokens.brand[600],   border: tokens.brand[400]   + '40' },
    gray:   { bg: tokens.gray[100],           text: tokens.gray[600],    border: tokens.gray[200] },
  }
  const c = map[color]
  return css`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: ${tokens.radius.full};
    font-size: 12px;
    font-weight: 500;
    background: ${c.bg};
    color: ${c.text};
    border: 1px solid ${c.border};
  `
}

export const progressBar = (pct: number, color: string = tokens.brand[500]) => css`
  width: 100%;
  height: 8px;
  background: ${tokens.gray[100]};
  border-radius: ${tokens.radius.full};
  overflow: hidden;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: ${pct}%;
    background: ${color};
    border-radius: ${tokens.radius.full};
    transition: width .6s cubic-bezier(.16,1,.3,1);
  }
`

export const button = {
  primary: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: ${tokens.brand[500]};
    color: #ffffff;
    border: none;
    border-radius: ${tokens.radius.md};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: ${tokens.transition.fast};
    &:hover  { background: ${tokens.brand[600]}; transform: translateY(-1px); box-shadow: ${tokens.shadow.md}; }
    &:active { transform: translateY(0); }
    &:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  `,
  secondary: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: #ffffff;
    color: ${tokens.gray[700]};
    border: 1px solid ${tokens.gray[200]};
    border-radius: ${tokens.radius.md};
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: ${tokens.transition.fast};
    &:hover  { background: ${tokens.gray[50]}; border-color: ${tokens.gray[300]}; }
    &:active { background: ${tokens.gray[100]}; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  `,
  danger: css`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: ${tokens.rose[500]};
    color: #ffffff;
    border: none;
    border-radius: ${tokens.radius.md};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: ${tokens.transition.fast};
    &:hover  { background: ${tokens.rose[600]}; }
    &:disabled { opacity: .5; cursor: not-allowed; }
  `,
  ghost: css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: transparent;
    color: ${tokens.gray[500]};
    border: none;
    border-radius: ${tokens.radius.sm};
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: ${tokens.transition.fast};
    &:hover { background: ${tokens.gray[100]}; color: ${tokens.gray[700]}; }
  `,
} as const

export const inputStyle = css`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${tokens.gray[200]};
  border-radius: ${tokens.radius.md};
  font-size: 14px;
  background: #ffffff;
  color: ${tokens.gray[900]};
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
  &:focus {
    border-color: ${tokens.brand[500]};
    box-shadow: 0 0 0 3px ${tokens.brand[500] + '20'};
  }
  &::placeholder { color: ${tokens.gray[400]}; }
`
