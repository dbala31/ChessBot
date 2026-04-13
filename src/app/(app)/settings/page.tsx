'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { GameSource } from '@/types'
import { Upload, Loader2, Trash2 } from 'lucide-react'

const AnalysisSection = dynamic(
  () => import('@/components/analysis/AnalysisSection').then((m) => m.AnalysisSection),
  {
    ssr: false,
    loading: () => (
      <div className="card p-5 text-xs" style={{ color: 'var(--text-muted)' }}>
        Loading analysis engine...
      </div>
    ),
  },
)

interface ImportStatus {
  readonly loading: boolean
  readonly result: { imported: number; total: number } | null
  readonly error: string | null
}

export default function SettingsPage() {
  const [chesscomUsername, setChesscomUsername] = useState('')
  const [lichessUsername, setLichessUsername] = useState('')
  const [currentRating, setCurrentRating] = useState('')
  const [targetRating, setTargetRating] = useState('')
  const [ratingSaved, setRatingSaved] = useState(false)
  const [importStatus, setImportStatus] = useState<Record<GameSource, ImportStatus>>({
    chesscom: { loading: false, result: null, error: null },
    lichess: { loading: false, result: null, error: null },
  })

  // Load saved settings
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.success && data.data) {
          if (data.data.chesscom_username) setChesscomUsername(data.data.chesscom_username)
          if (data.data.lichess_username) setLichessUsername(data.data.lichess_username)
          if (data.data.current_rating) setCurrentRating(String(data.data.current_rating))
          if (data.data.target_rating) setTargetRating(String(data.data.target_rating))
        }
      } catch {
        // ignore
      }
    }
    load()
  }, [])

  const saveSettings = useCallback(
    async (overrides?: { rating?: number; target?: number }) => {
      const body: Record<string, unknown> = {
        chesscomUsername: chesscomUsername || null,
        lichessUsername: lichessUsername || null,
      }
      if (overrides?.rating !== undefined) body.currentRating = overrides.rating
      if (overrides?.target !== undefined) body.targetRating = overrides.target
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    },
    [chesscomUsername, lichessUsername],
  )

  async function handleImport(source: GameSource) {
    const username = source === 'chesscom' ? chesscomUsername : lichessUsername
    if (!username.trim()) return

    setImportStatus((prev) => ({ ...prev, [source]: { loading: true, result: null, error: null } }))

    await saveSettings()

    try {
      const res = await fetch('/api/games/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), source, limit: 200 }),
      })
      const data = await res.json()

      if (!data.success) {
        setImportStatus((prev) => ({
          ...prev,
          [source]: { loading: false, result: null, error: data.error },
        }))
        return
      }
      setImportStatus((prev) => ({
        ...prev,
        [source]: { loading: false, result: data.data, error: null },
      }))
    } catch {
      setImportStatus((prev) => ({
        ...prev,
        [source]: { loading: false, result: null, error: 'Network error.' },
      }))
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        Settings
      </h1>
      <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        Connect accounts and import games
      </p>

      <div className="space-y-4">
        {(['chesscom', 'lichess'] as const).map((source) => {
          const status = importStatus[source]
          const username = source === 'chesscom' ? chesscomUsername : lichessUsername
          const setUsername = source === 'chesscom' ? setChesscomUsername : setLichessUsername
          const label = source === 'chesscom' ? 'Chess.com' : 'Lichess'

          return (
            <div key={source} className="card p-5">
              <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {label}
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`${label} username`}
                  className="flex-1 rounded-md px-3 py-2 text-xs transition-all duration-150 outline-none focus:ring-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={() => handleImport(source)}
                  disabled={status.loading || !username.trim()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  {status.loading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Upload size={13} />
                  )}
                  {status.loading ? 'Importing...' : 'Import'}
                </button>
              </div>
              {status.result && (
                <p className="mt-2 text-xs" style={{ color: 'var(--success)' }}>
                  Imported {status.result.imported} new games ({status.result.total} total)
                </p>
              )}
              {status.error && (
                <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
                  {status.error}
                </p>
              )}
            </div>
          )
        })}

        {/* Rating */}
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Rating
          </h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Your scores are measured relative to your rating level. A 1300 player is judged against
            1300 benchmarks.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="mb-1 block text-[11px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Current Rating
              </label>
              <input
                type="number"
                value={currentRating}
                onChange={(e) => {
                  setCurrentRating(e.target.value)
                  setRatingSaved(false)
                }}
                placeholder="e.g. 1300"
                min={100}
                max={3500}
                className="w-full rounded-md px-3 py-2 text-xs transition-all duration-150 outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div className="flex-1">
              <label
                className="mb-1 block text-[11px] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Target Rating
              </label>
              <input
                type="number"
                value={targetRating}
                onChange={(e) => {
                  setTargetRating(e.target.value)
                  setRatingSaved(false)
                }}
                placeholder="e.g. 1700"
                min={100}
                max={3500}
                className="w-full rounded-md px-3 py-2 text-xs transition-all duration-150 outline-none focus:ring-2"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              await saveSettings({
                rating: currentRating ? Number(currentRating) : undefined,
                target: targetRating ? Number(targetRating) : undefined,
              })
              setRatingSaved(true)
              // Recompute skills with new rating
              await fetch('/api/skills/compute', { method: 'POST' })
            }}
            className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150"
            style={{ background: 'var(--accent)' }}
          >
            Save & Recompute Scores
          </button>
          {ratingSaved && (
            <p className="mt-2 text-xs" style={{ color: 'var(--success)' }}>
              Saved! Scores recalculated for your level.
            </p>
          )}
        </div>

        <AnalysisSection />

        {/* Danger zone */}
        <div className="card p-5" style={{ borderColor: 'var(--danger)' }}>
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--danger)' }}>
            Danger Zone
          </h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Delete all your data — games, analysis, drills, scores. This cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (!confirm('Are you sure? This will delete ALL your data permanently.')) return
              try {
                const res = await fetch('/api/reset', { method: 'POST' })
                const data = await res.json()
                if (data.success) {
                  alert('All data deleted. Reloading...')
                  window.location.reload()
                } else {
                  alert('Error: ' + (data.error ?? 'Unknown'))
                }
              } catch {
                alert('Network error')
              }
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150"
            style={{ background: 'var(--danger)' }}
          >
            <Trash2 size={13} />
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  )
}
