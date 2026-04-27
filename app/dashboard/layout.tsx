import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main
        style={{
          marginLeft: 256,
          flex: 1,
          minHeight: '100vh',
          background: '#f5f6f8',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="dashboard-main"
      >
        {/* Responsive override */}
        <style>{`
          @media (max-width: 1024px) {
            .dashboard-main { margin-left: 0 !important; }
          }
        `}</style>
        {children}
      </main>
    </div>
  )
}
