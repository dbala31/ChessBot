'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LimelightNav } from '@/components/ui/limelight-nav'
import type { NavItem } from '@/components/ui/limelight-nav'
import { LayoutDashboard, Target, Gamepad2, BarChart3, Settings, Crown } from 'lucide-react'

const NAV_ROUTES = ['/dashboard', '/report', '/train', '/games', '/settings'] as const

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const activeIndex = NAV_ROUTES.findIndex(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  )

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      icon: <LayoutDashboard />,
      label: 'Dashboard',
      onClick: () => router.push('/dashboard'),
    },
    {
      id: 'report',
      icon: <BarChart3 />,
      label: 'Report',
      onClick: () => router.push('/report'),
    },
    {
      id: 'train',
      icon: <Target />,
      label: 'Training',
      onClick: () => router.push('/train'),
    },
    {
      id: 'games',
      icon: <Gamepad2 />,
      label: 'Games',
      onClick: () => router.push('/games'),
    },
    {
      id: 'settings',
      icon: <Settings />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
  ]

  return (
    <div className="flex h-screen flex-col" style={{ background: 'var(--bg-secondary)' }}>
      {/* Top header */}
      <header
        className="flex h-16 items-center justify-between px-6"
        style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Crown size={16} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ChessBot
          </span>
        </div>

        {/* LimelightNav — centered */}
        <LimelightNav
          items={navItems}
          defaultActiveIndex={activeIndex >= 0 ? activeIndex : 0}
          className="rounded-xl border-0 bg-transparent"
          iconClassName="!w-5 !h-5"
          iconContainerClassName="px-4"
        />

        {/* Right spacer for centering */}
        <div className="w-24" />
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
        {children}
      </main>
    </div>
  )
}
