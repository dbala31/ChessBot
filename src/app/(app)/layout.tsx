'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  readonly href: string
  readonly label: string
  readonly icon: string
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/train', label: 'Train', icon: '🎯' },
  { href: '/games', label: 'Games', icon: '♟️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 flex h-full w-64 flex-col border-r border-gray-800 bg-gray-900 transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-6">
          <span className="text-2xl">♚</span>
          <span className="text-lg font-bold tracking-tight">ChessBot</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600/20 text-green-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 px-6 py-4">
          <p className="text-xs text-gray-500">ChessBot v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center border-b border-gray-800 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-4 text-gray-400 hover:text-gray-200 lg:hidden"
            aria-label="Open sidebar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-100">
            {NAV_ITEMS.find(
              (item) =>
                pathname === item.href ||
                pathname.startsWith(item.href + '/'),
            )?.label ?? 'ChessBot'}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
