'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Check, Clock, Loader2, AlertCircle } from 'lucide-react'

interface GameRow {
  readonly id: string
  readonly opponent: string
  readonly result: string
  readonly userColor: 'white' | 'black'
  readonly timeControl: string
  readonly source: 'lichess' | 'chesscom'
  readonly playedAt: string
  readonly openingEco: string
  readonly analysisComplete: boolean
  readonly accuracy: number | null
  readonly blunders: number | null
}

type FilterSource = 'all' | 'lichess' | 'chesscom'
type FilterResult = 'all' | '1-0' | '0-1' | '1/2-1/2'

export default function GamesPage() {
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all')
  const [resultFilter, setResultFilter] = useState<FilterResult>('all')
  const [games, setGames] = useState<readonly GameRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGames = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (resultFilter !== 'all') params.set('result', resultFilter)
    params.set('limit', '50')

    try {
      const res = await fetch(`/api/games?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setGames(data.data)
      } else {
        setError(data.error ?? 'Failed to load games')
      }
    } catch {
      setError('Network error — could not load games')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, resultFilter])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  function pillClass(_active: boolean): string {
    return 'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150'
  }

  function pillStyle(active: boolean) {
    return active
      ? {
          background: 'var(--accent-light)',
          color: 'var(--accent)',
          border: '1px solid var(--accent)',
        }
      : {
          background: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
        }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'lichess', 'chesscom'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSourceFilter(s)}
            className={pillClass(sourceFilter === s)}
            style={pillStyle(sourceFilter === s)}
          >
            {s === 'all' ? 'All Sources' : s === 'lichess' ? 'Lichess' : 'Chess.com'}
          </button>
        ))}
        <div className="mx-2 h-4 w-px" style={{ background: 'var(--border)' }} />
        {(['all', '1-0', '0-1', '1/2-1/2'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setResultFilter(r)}
            className={pillClass(resultFilter === r)}
            style={pillStyle(resultFilter === r)}
          >
            {r === 'all' ? 'All Results' : r}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Loading games...
          </span>
        </div>
      )}

      {error && (
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
          <span className="text-sm" style={{ color: 'var(--danger)' }}>
            {error}
          </span>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No games found.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Go to{' '}
            <Link href="/settings" style={{ color: 'var(--accent)' }}>
              Settings
            </Link>{' '}
            to import games from Chess.com or Lichess.
          </p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Opponent</th>
                <th className="px-4 py-3 text-left font-medium">Color</th>
                <th className="px-4 py-3 text-left font-medium">Result</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Opening</th>
                <th className="px-4 py-3 text-left font-medium">Accuracy</th>
                <th className="px-4 py-3 text-left font-medium">Blunders</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr
                  key={game.id}
                  className="cursor-pointer transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {new Date(game.playedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/games/${game.id}`}
                      className="transition-colors duration-150"
                      style={{ color: 'var(--accent)' }}
                    >
                      {game.opponent}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-block h-4 w-4 rounded-full"
                      style={{
                        background: game.userColor === 'white' ? '#fff' : '#18181b',
                        border: '1.5px solid var(--border)',
                      }}
                    />
                  </td>
                  <td
                    className="px-4 py-3 font-mono font-semibold"
                    style={{
                      color:
                        game.result === '1-0'
                          ? 'var(--success)'
                          : game.result === '0-1'
                            ? 'var(--danger)'
                            : 'var(--warning)',
                    }}
                  >
                    {game.result}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                    {game.timeControl}
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>
                    {game.openingEco}
                  </td>
                  <td
                    className="px-4 py-3 font-medium"
                    style={{
                      color:
                        game.accuracy != null
                          ? game.accuracy >= 85
                            ? 'var(--success)'
                            : game.accuracy >= 70
                              ? 'var(--warning)'
                              : 'var(--danger)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {game.accuracy != null ? `${game.accuracy}%` : '\u2014'}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{
                      color:
                        game.blunders != null
                          ? game.blunders === 0
                            ? 'var(--success)'
                            : 'var(--danger)'
                          : 'var(--text-muted)',
                    }}
                  >
                    {game.blunders != null ? game.blunders : '\u2014'}
                  </td>
                  <td className="px-4 py-3">
                    {game.analysisComplete ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: 'var(--success-light)', color: 'var(--success)' }}
                      >
                        <Check size={10} /> Done
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                      >
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
