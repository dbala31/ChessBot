'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="text-center">
        <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
        <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 mx-auto"
          style={{ background: 'var(--accent)' }}
        >
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    </div>
  )
}
