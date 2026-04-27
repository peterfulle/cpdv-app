'use client'

import { SessionProvider } from 'next-auth/react'
import { Global, css } from '@emotion/react'
import type { Session } from 'next-auth'

const globalStyles = css`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    height: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    color: #111827;
    background: #f9fafb;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #9ca3af; }

  :focus-visible { outline: 2px solid #6172f3; outline-offset: 2px; }
  ::selection { background: #e0e9ff; color: #2e3384; }

  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
  @keyframes shimmer { from { background-position:-200% 0 } to { background-position:200% 0 } }
  @keyframes spin { to { transform: rotate(360deg) } }
`

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <Global styles={globalStyles} />
      {children}
    </SessionProvider>
  )
}
