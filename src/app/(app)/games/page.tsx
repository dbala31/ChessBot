'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Clock } from 'lucide-react'

const MOCK_GAMES = Array.from({ length: 15 }, (_, i) => ({
  id: String(i + 1),
  opponent: ['MagnusFan99', 'ChessMaster2000', 'QuietPawn', 'TacticalKnight', 'EndgameWizard', 'BlitzKing42', 'PositionalPro', 'KnightRider_', 'PawnStorm77', 'CheckMateInTwo'][i % 10],
  result: ['1-0', '0-1', '1/2-1/2'][i % 3],
  userColor: i % 2 === 0 ? ('white' as const) : ('black' as const),
  timeControl: ['3+0', '5+0', '5+3', '10+0', '15+10'][i % 5],
  source: i % 2 === 0 ? ('lichess' as const) : ('chesscom' as const),
  playedAt: new Date(2026, 3, 12 - Math.floor(i / 3), 10 - i).toISOString(),
  openingEco: ['B20', 'C50', 'D35', 'A45', 'E60'][i % 5],
  analysisComplete: i < 12,
  accuracy: Math.round(65 + Math.random() * 30),
  blunders: Math.floor(Math.random() * 4),
}))

type FilterSource = 'all' | 'lichess' | 'chesscom'
type FilterResult = 'all' | '1-0' | '0-1' | '1/2-1/2'

export default function GamesPage() {
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all')
  const [resultFilter, setResultFilter] = useState<FilterResult>('all')

  const filtered = MOCK_GAMES.filter((g) => {
    if (sourceFilter !== 'all' && g.source !== sourceFilter) return false
    if (resultFilter !== 'all' && g.result !== resultFilter) return false
    return true
  })

  function pillClass(active: boolean): string {
    return `cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150`
  }

  function pillStyle(active: boolean) {
    return active
      ? { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)' }
      : { background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'lichess', 'chesscom'] as const).map((s) => (
          <button key={s} onClick={() => setSourceFilter(s)} className={pillClass(sourceFilter === s)} style={pillStyle(sourceFilter === s)}>
            {s === 'all' ? 'All Sources' : s === 'lichess' ? 'Lichess' : 'Chess.com'}
          </button>
        ))}
        <div className="mx-2 h-4 w-px" style={{ background: 'var(--border)' }} />
        {(['all', '1-0', '0-1', '1/2-1/2'] as const).map((r) => (
          <button key={r} onClick={() => setResultFilter(r)} className={pillClass(resultFilter === r)} style={pillStyle(resultFilter === r)}>
            {r === 'all' ? 'All Results' : r}
          </button>
        ))}
      </div>

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
            {filtered.map((game) => (
              <tr key={game.id} className="cursor-pointer transition-colors duration-100" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>{new Date(game.playedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/games/${game.id}`} className="transition-colors duration-150" style={{ color: 'var(--accent)' }}>{game.opponent}</Link>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block h-4 w-4 rounded-full" style={{ background: game.userColor === 'white' ? '#fff' : '#18181b', border: '1.5px solid var(--border)' }} />
                </td>
                <td className="px-4 py-3 font-mono font-semibold" style={{ color: game.result === '1-0' ? 'var(--success)' : game.result === '0-1' ? 'var(--danger)' : 'var(--warning)' }}>
                  {game.result}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{game.timeControl}</td>
                <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-muted)' }}>{game.openingEco}</td>
                <td className="px-4 py-3 font-medium" style={{ color: game.analysisComplete ? (game.accuracy >= 85 ? 'var(--success)' : game.accuracy >= 70 ? 'var(--warning)' : 'var(--danger)') : 'var(--text-muted)' }}>
                  {game.analysisComplete ? `${game.accuracy}%` : '\u2014'}
                </td>
                <td className="px-4 py-3" style={{ color: game.analysisComplete ? (game.blunders === 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}>
                  {game.analysisComplete ? game.blunders : '\u2014'}
                </td>
                <td className="px-4 py-3">
                  {game.analysisComplete ? (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                      <Check size={10} /> Done
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                      <Clock size={10} /> Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
