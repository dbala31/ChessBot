'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const Board = dynamic(() => import('./Board').then((mod) => ({ default: mod.Board })), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square w-full items-center justify-center rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  ),
})

export { Board as LazyBoard }
