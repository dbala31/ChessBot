'use client'

import { useState, useEffect } from 'react'
import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import Link from 'next/link'
import { TrendingUp, Flame, Target, ArrowRight, AlertTriangle, BarChart3, Loader2 } from 'lucide-react'

const SKILL_LABELS: Record<string, string> = {
  [ScoreType.Tactics]: 'Tactics',
  [ScoreType.Endgame]: 'Endgame',
  [ScoreType.AdvantageCapitalization]: 'Advantage',
  [ScoreType.Resourcefulness]: 'Resourcefulness',
  [ScoreType.TimeManagement]: 'Time Mgmt',
  [ScoreType.OpeningPerformance]: 'Openings',
}

interface DashboardData {
  readonly gamesAnalyzed: number
  readonly streak: number
  readonly drillsToday: number
  readonly drillsCorrect: number
  readonly drillsTarget: number
  readonly scores: readonly { scoreType: string; value: number }[]
  readonly recentGames: readonly {
    id: string
    opponent: string
    result: string
    timeControl: string
    source: string
    playedAt: string
    accuracy: number | null
    blunders: number | null
  }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/stats')
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch {
        // silently fail — dashboard shows empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  const scores = data?.scores ?? []
  const radarScores = scores.map((s) => ({ scoreType: s.scoreType as ScoreType, value: s.value }))
  const weakest = scores.length > 0
    ? [...scores].sort((a, b) => a.value - b.value)[0]
    : null

  const gamesAnalyzed = data?.gamesAnalyzed ?? 0
  const streakDays = data?.streak ?? 0
  const drillsToday = data?.drillsToday ?? 0
  const drillsTarget = data?.drillsTarget ?? 15
  const recentGames = data?.recentGames ?? []

  return (
    <div className="p-4 lg:p-6">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Games Analyzed', value: String(gamesAnalyzed), icon: BarChart3, change: gamesAnalyzed > 0 ? 'Stockfish analysis complete' : 'Import & analyze games' },
          { label: 'Training Streak', value: streakDays > 0 ? `${streakDays} day${streakDays !== 1 ? 's' : ''}` : '0 days', icon: Flame, change: streakDays > 0 ? 'Keep it up!' : 'Start training today' },
          { label: 'Drills Today', value: `${drillsToday} / ${drillsTarget}`, icon: Target, change: drillsToday >= drillsTarget ? 'Daily goal reached!' : `${Math.round((drillsToday / drillsTarget) * 100)}% complete` },
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
                {gamesAnalyzed > 0 ? `Based on ${gamesAnalyzed} analyzed games` : 'Import and analyze games to see your skills'}
              </p>
            </div>
          </div>
          {radarScores.length > 0 ? (
            <SkillRadar scores={radarScores} />
          ) : (
            <div className="flex h-48 items-center justify-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No skill data yet. <Link href="/settings" style={{ color: 'var(--accent)' }}>Import games</Link> to get started.
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Weakest */}
          {weakest && (
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
                {SKILL_LABELS[weakest.scoreType] ?? weakest.scoreType}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Score: {Math.round(weakest.value)}/100
              </p>
              <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Focus training here for the biggest rating improvement.
              </p>
            </div>
          )}

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
          {scores.length > 0 && (
            <div className="space-y-2">
              {scores.map((score) => {
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
                      {SKILL_LABELS[score.scoreType] ?? score.scoreType}
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
                        {Math.round(score.value)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
          {recentGames.length > 0 ? (
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
                {recentGames.map((game) => (
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
                        color: game.accuracy != null
                          ? game.accuracy >= 85 ? 'var(--success)' : game.accuracy >= 70 ? 'var(--warning)' : 'var(--danger)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {game.accuracy != null ? `${game.accuracy}%` : '\u2014'}
                    </td>
                    <td
                      className="px-5 py-2.5"
                      style={{ color: game.blunders != null ? (game.blunders === 0 ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)' }}
                    >
                      {game.blunders != null ? game.blunders : '\u2014'}
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
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No games yet. <Link href="/settings" style={{ color: 'var(--accent)' }}>Import games</Link> to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
