'use client'

import { useState } from 'react'
import type { GameSource } from '@/types'
import { Upload, FlaskConical } from 'lucide-react'

interface ImportStatus {
  readonly loading: boolean
  readonly result: { imported: number; total: number } | null
  readonly error: string | null
}

export default function SettingsPage() {
  const [chesscomUsername, setChesscomUsername] = useState('')
  const [lichessUsername, setLichessUsername] = useState('')
  const [importStatus, setImportStatus] = useState<Record<GameSource, ImportStatus>>({
    chesscom: { loading: false, result: null, error: null },
    lichess: { loading: false, result: null, error: null },
  })

  async function handleImport(source: GameSource) {
    const username = source === 'chesscom' ? chesscomUsername : lichessUsername
    if (!username.trim()) return

    setImportStatus((prev) => ({ ...prev, [source]: { loading: true, result: null, error: null } }))

    try {
      const res = await fetch('/api/games/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), source, limit: 200 }),
      })
      const data = await res.json()

      if (!data.success) {
        setImportStatus((prev) => ({ ...prev, [source]: { loading: false, result: null, error: data.error } }))
        return
      }
      setImportStatus((prev) => ({ ...prev, [source]: { loading: false, result: data.data, error: null } }))
    } catch {
      setImportStatus((prev) => ({ ...prev, [source]: { loading: false, result: null, error: 'Network error.' } }))
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-1 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
      <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>Connect accounts and import games</p>

      <div className="space-y-4">
        {(['chesscom', 'lichess'] as const).map((source) => {
          const status = importStatus[source]
          const username = source === 'chesscom' ? chesscomUsername : lichessUsername
          const setUsername = source === 'chesscom' ? setChesscomUsername : setLichessUsername
          const label = source === 'chesscom' ? 'Chess.com' : 'Lichess'

          return (
            <div key={source} className="card p-5">
              <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`${label} username`}
                  className="flex-1 rounded-md px-3 py-2 text-xs outline-none transition-all duration-150 focus:ring-2"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={() => handleImport(source)}
                  disabled={status.loading || !username.trim()}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: 'var(--accent)' }}
                >
                  <Upload size={13} />
                  {status.loading ? 'Importing...' : 'Import'}
                </button>
              </div>
              {status.result && (
                <p className="mt-2 text-xs" style={{ color: 'var(--success)' }}>
                  Imported {status.result.imported} new games ({status.result.total} total)
                </p>
              )}
              {status.error && (
                <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>{status.error}</p>
              )}
            </div>
          )
        })}

        <div className="card p-5">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Analysis</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>Run Stockfish on all unanalyzed games</p>
          <button className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150" style={{ background: 'var(--accent)' }}>
            <FlaskConical size={13} /> Analyze All Games
          </button>
        </div>
      </div>
    </div>
  )
}
