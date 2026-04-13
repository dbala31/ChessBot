'use client'

import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import Link from 'next/link'
import { TrendingUp, Flame, Target, ArrowRight, AlertTriangle, BarChart3 } from 'lucide-react'

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
    source: 'lichess' as const,
    playedAt: '2026-04-12T10:30:00Z',
    accuracy: 91,
    blunders: 0,
  },
  {
    id: '2',
    opponent: 'ChessMaster2000',
    result: '0-1',
    timeControl: '3+0',
    source: 'chesscom' as const,
    playedAt: '2026-04-12T09:15:00Z',
    accuracy: 74,
    blunders: 2,
  },
  {
    id: '3',
    opponent: 'QuietPawn',
    result: '1/2-1/2',
    timeControl: '10+0',
    source: 'lichess' as const,
    playedAt: '2026-04-11T20:00:00Z',
    accuracy: 85,
    blunders: 1,
  },
  {
    id: '4',
    opponent: 'TacticalKnight',
    result: '1-0',
    timeControl: '5+3',
    source: 'chesscom' as const,
    playedAt: '2026-04-11T18:30:00Z',
    accuracy: 88,
    blunders: 0,
  },
  {
    id: '5',
    opponent: 'EndgameWizard',
    result: '0-1',
    timeControl: '15+10',
    source: 'lichess' as const,
    playedAt: '2026-04-11T15:00:00Z',
    accuracy: 69,
    blunders: 3,
  },
]

const SKILL_LABELS: Record<ScoreType, string> = {
  [ScoreType.Tactics]: 'Tactics',
  [ScoreType.Endgame]: 'Endgame',
  [ScoreType.AdvantageCapitalization]: 'Advantage',
  [ScoreType.Resourcefulness]: 'Resourcefulness',
  [ScoreType.TimeManagement]: 'Time Mgmt',
  [ScoreType.OpeningPerformance]: 'Openings',
}

function getWeakest() {
  const w = [...MOCK_SCORES].sort((a, b) => a.value - b.value)[0]
  return { label: SKILL_LABELS[w.scoreType], value: w.value }
}

export default function DashboardPage() {
  const weakest = getWeakest()

  return (
    <div className="p-4 lg:p-6">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Games Analyzed', value: '142', icon: BarChart3, change: '+12 this week' },
          { label: 'Training Streak', value: '7 days', icon: Flame, change: 'Personal best' },
          { label: 'Drills Today', value: '8 / 15', icon: Target, change: '53% complete' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: 'var(--success)' }}>
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Radar */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Skill Overview
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Based on 142 analyzed games
              </p>
            </div>
          </div>
          <SkillRadar scores={MOCK_SCORES} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Weakest */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--border)',
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
              <span
                className="text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: 'var(--danger)' }}
              >
                Weakest area
              </span>
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {weakest.label}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Score: {weakest.value}/100
            </p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Focus training here for the biggest rating improvement.
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/train"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-150"
            style={{ background: 'var(--accent)' }}
          >
            <Target size={16} />
            Start Training
            <ArrowRight size={14} />
          </Link>

          {/* Skill cards */}
          <div className="space-y-2">
            {MOCK_SCORES.map((score) => {
              const color =
                score.value >= 70
                  ? 'var(--success)'
                  : score.value >= 40
                    ? 'var(--warning)'
                    : 'var(--danger)'
              return (
                <div
                  key={score.scoreType}
                  className="card flex items-center justify-between px-4 py-3"
                >
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {SKILL_LABELS[score.scoreType]}
                  </span>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-1.5 w-20 overflow-hidden rounded-full"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${score.value}%`, background: color }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold" style={{ color }}>
                      {score.value}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Games */}
        <div className="card overflow-x-auto lg:col-span-3">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Games
            </h2>
            <Link
              href="/games"
              className="flex cursor-pointer items-center gap-1 text-xs font-medium transition-colors duration-150"
              style={{ color: 'var(--accent)' }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="px-5 py-2.5 text-left font-medium">Opponent</th>
                <th className="px-5 py-2.5 text-left font-medium">Result</th>
                <th className="px-5 py-2.5 text-left font-medium">Time</th>
                <th className="px-5 py-2.5 text-left font-medium">Accuracy</th>
                <th className="px-5 py-2.5 text-left font-medium">Blunders</th>
                <th className="px-5 py-2.5 text-left font-medium">Source</th>
                <th className="px-5 py-2.5 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_GAMES.map((game) => (
                <tr
                  key={game.id}
                  className="cursor-pointer transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-5 py-2.5 font-medium" style={{ color: 'var(--accent)' }}>
                    <Link href={`/games/${game.id}`}>{game.opponent}</Link>
                  </td>
                  <td
                    className="px-5 py-2.5 font-mono font-semibold"
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
                  <td className="px-5 py-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {game.timeControl}
                  </td>
                  <td
                    className="px-5 py-2.5 font-medium"
                    style={{
                      color:
                        game.accuracy >= 85
                          ? 'var(--success)'
                          : game.accuracy >= 70
                            ? 'var(--warning)'
                            : 'var(--danger)',
                    }}
                  >
                    {game.accuracy}%
                  </td>
                  <td
                    className="px-5 py-2.5"
                    style={{ color: game.blunders === 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {game.blunders}
                  </td>
                  <td className="px-5 py-2.5" style={{ color: 'var(--text-muted)' }}>
                    {game.source === 'lichess' ? 'Lichess' : 'Chess.com'}
                  </td>
                  <td className="px-5 py-2.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(game.playedAt).toLocaleDateString()}
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
