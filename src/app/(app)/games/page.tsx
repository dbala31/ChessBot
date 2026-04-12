'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data for design
const MOCK_GAMES = Array.from({ length: 20 }, (_, i) => ({
  id: String(i + 1),
  opponent: [
    'MagnusFan99',
    'ChessMaster2000',
    'QuietPawn',
    'TacticalKnight',
    'EndgameWizard',
    'BlitzKing42',
    'PositionalPro',
    'KnightRider_',
    'PawnStorm77',
    'CheckMateInTwo',
  ][i % 10],
  result: ['1-0', '0-1', '1/2-1/2'][i % 3],
  userColor: i % 2 === 0 ? ('white' as const) : ('black' as const),
  timeControl: ['3+0', '5+0', '5+3', '10+0', '15+10'][i % 5],
  source: i % 2 === 0 ? ('lichess' as const) : ('chesscom' as const),
  playedAt: new Date(2026, 3, 12 - Math.floor(i / 3), 10 - i).toISOString(),
  openingEco: ['B20', 'C50', 'D35', 'A45', 'E60'][i % 5],
  analysisComplete: i < 15,
  accuracy: Math.round(65 + Math.random() * 30),
  blunders: Math.floor(Math.random() * 4),
}))

type FilterSource = 'all' | 'lichess' | 'chesscom'
type FilterResult = 'all' | '1-0' | '0-1' | '1/2-1/2'

function getResultColor(result: string): string {
  if (result === '1-0') return 'text-green-400'
  if (result === '0-1') return 'text-red-400'
  return 'text-yellow-400'
}

export default function GamesPage() {
  const [sourceFilter, setSourceFilter] = useState<FilterSource>('all')
  const [resultFilter, setResultFilter] = useState<FilterResult>('all')

  const filtered = MOCK_GAMES.filter((g) => {
    if (sourceFilter !== 'all' && g.source !== sourceFilter) return false
    if (resultFilter !== 'all' && g.result !== resultFilter) return false
    return true
  })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h2 className="text-lg font-semibold">All Games</h2>

        <div className="flex gap-2 text-sm">
          {(['all', 'lichess', 'chesscom'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                sourceFilter === s
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {s === 'all' ? 'All' : s === 'lichess' ? '♞ Lichess' : '♜ Chess.com'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-sm">
          {(['all', '1-0', '0-1', '1/2-1/2'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                resultFilter === r
                  ? 'bg-green-600/20 text-green-400'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {r === 'all' ? 'All Results' : r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Opponent</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Opening</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Blunders</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((game) => (
                <tr
                  key={game.id}
                  className="transition-colors hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(game.playedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/games/${game.id}`}
                      className="hover:text-green-400"
                    >
                      {game.opponent}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-4 w-4 rounded-full border ${
                        game.userColor === 'white'
                          ? 'border-gray-600 bg-white'
                          : 'border-gray-600 bg-gray-900'
                      }`}
                    />
                  </td>
                  <td
                    className={`px-4 py-3 font-mono font-semibold ${getResultColor(game.result)}`}
                  >
                    {game.result}
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {game.timeControl}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">
                    {game.openingEco}
                  </td>
                  <td className="px-4 py-3">
                    {game.analysisComplete ? (
                      <span
                        className={
                          game.accuracy >= 85
                            ? 'text-green-400'
                            : game.accuracy >= 70
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }
                      >
                        {game.accuracy}%
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {game.analysisComplete ? (
                      <span
                        className={
                          game.blunders === 0
                            ? 'text-green-400'
                            : game.blunders <= 1
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }
                      >
                        {game.blunders}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {game.analysisComplete ? (
                      <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                        Analyzed
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
