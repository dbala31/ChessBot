'use client'

import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import Link from 'next/link'

// Mock data for design — will be replaced with real data fetching
const MOCK_SCORES = [
  { scoreType: ScoreType.Tactics, value: 72 },
  { scoreType: ScoreType.Endgame, value: 45 },
  { scoreType: ScoreType.AdvantageCapitalization, value: 61 },
  { scoreType: ScoreType.Resourcefulness, value: 38 },
  { scoreType: ScoreType.TimeManagement, value: 55 },
  { scoreType: ScoreType.OpeningPerformance, value: 78 },
]

const MOCK_GAMES = [
  {
    id: '1',
    opponent: 'MagnusFan99',
    result: '1-0',
    timeControl: '5+0',
    source: 'lichess',
    playedAt: '2026-04-12T10:30:00Z',
    accuracy: 91,
    blunders: 0,
  },
  {
    id: '2',
    opponent: 'ChessMaster2000',
    result: '0-1',
    timeControl: '3+0',
    source: 'chesscom',
    playedAt: '2026-04-12T09:15:00Z',
    accuracy: 74,
    blunders: 2,
  },
  {
    id: '3',
    opponent: 'QuietPawn',
    result: '1/2-1/2',
    timeControl: '10+0',
    source: 'lichess',
    playedAt: '2026-04-11T20:00:00Z',
    accuracy: 85,
    blunders: 1,
  },
  {
    id: '4',
    opponent: 'TacticalKnight',
    result: '1-0',
    timeControl: '5+3',
    source: 'chesscom',
    playedAt: '2026-04-11T18:30:00Z',
    accuracy: 88,
    blunders: 0,
  },
  {
    id: '5',
    opponent: 'EndgameWizard',
    result: '0-1',
    timeControl: '15+10',
    source: 'lichess',
    playedAt: '2026-04-11T15:00:00Z',
    accuracy: 69,
    blunders: 3,
  },
]

function getResultColor(result: string): string {
  if (result === '1-0') return 'text-green-400'
  if (result === '0-1') return 'text-red-400'
  return 'text-yellow-400'
}

function getWeakestSkill() {
  const weakest = [...MOCK_SCORES].sort((a, b) => a.value - b.value)[0]
  const labels: Record<ScoreType, string> = {
    [ScoreType.Tactics]: 'Tactics',
    [ScoreType.Endgame]: 'Endgame',
    [ScoreType.AdvantageCapitalization]: 'Converting Advantages',
    [ScoreType.Resourcefulness]: 'Resourcefulness',
    [ScoreType.TimeManagement]: 'Time Management',
    [ScoreType.OpeningPerformance]: 'Openings',
  }
  return { label: labels[weakest.scoreType], value: weakest.value }
}

export default function DashboardPage() {
  const weakest = getWeakestSkill()

  return (
    <div className="p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Skill Radar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Skill Overview</h2>
          <SkillRadar scores={MOCK_SCORES} />
        </div>

        {/* Weakest Area + CTA */}
        <div className="space-y-6">
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6">
            <h3 className="text-sm font-medium text-red-400">
              Weakest Area
            </h3>
            <p className="mt-2 text-2xl font-bold">{weakest.label}</p>
            <p className="mt-1 text-sm text-gray-400">
              Score: {weakest.value}/100
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Focus your training on {weakest.label.toLowerCase()} to see the
              biggest improvement in your games.
            </p>
          </div>

          <Link
            href="/train"
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
          >
            🎯 Start Training
          </Link>
        </div>

        {/* Recent Games */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Games</h2>
            <Link
              href="/games"
              className="text-sm text-green-400 hover:text-green-300"
            >
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-gray-400">
                  <th className="pb-3 pr-4">Opponent</th>
                  <th className="pb-3 pr-4">Result</th>
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Accuracy</th>
                  <th className="pb-3 pr-4">Blunders</th>
                  <th className="pb-3 pr-4">Source</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {MOCK_GAMES.map((game) => (
                  <tr
                    key={game.id}
                    className="transition-colors hover:bg-gray-800/50"
                  >
                    <td className="py-3 pr-4 font-medium">
                      <Link
                        href={`/games/${game.id}`}
                        className="hover:text-green-400"
                      >
                        {game.opponent}
                      </Link>
                    </td>
                    <td
                      className={`py-3 pr-4 font-mono font-semibold ${getResultColor(game.result)}`}
                    >
                      {game.result}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {game.timeControl}
                    </td>
                    <td className="py-3 pr-4">
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
                    </td>
                    <td className="py-3 pr-4">
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
                    </td>
                    <td className="py-3 pr-4 text-gray-400">
                      {game.source === 'lichess' ? '♞ Lichess' : '♜ Chess.com'}
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(game.playedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
