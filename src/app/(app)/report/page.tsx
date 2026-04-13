'use client'

import { useState, useEffect } from 'react'
import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Swords,
  Crown,
  Clock,
  BookOpen,
  Shield,
  Trophy,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

const SKILL_META: Record<ScoreType, { icon: typeof Swords; label: string; description: string }> = {
  [ScoreType.OpeningPerformance]: { icon: BookOpen, label: 'Opening', description: 'How well you play the first 15 moves' },
  [ScoreType.Tactics]: { icon: Swords, label: 'Tactics', description: 'Ability to find and execute tactical combinations' },
  [ScoreType.Resourcefulness]: { icon: Shield, label: 'Resourcefulness', description: 'How well you defend and fight back from worse positions' },
  [ScoreType.AdvantageCapitalization]: { icon: Trophy, label: 'Advantage Capitalization', description: 'Converting winning positions into actual wins' },
  [ScoreType.TimeManagement]: { icon: Clock, label: 'Time Management', description: 'Clock usage consistency and avoiding time-pressure blunders' },
  [ScoreType.Endgame]: { icon: Crown, label: 'Endgame', description: 'Technique in positions with few pieces remaining' },
}

function getRecommendation(scoreType: ScoreType, value: number): string {
  if (value >= 70) return 'Strong area. Keep practicing to maintain this strength.'
  if (value >= 50) return 'Decent foundation. Targeted practice will push you above average.'

  const recs: Record<ScoreType, string> = {
    [ScoreType.OpeningPerformance]: 'Study your most-played openings. Focus on understanding pawn structures, not memorizing moves.',
    [ScoreType.Tactics]: 'Practice tactical puzzles daily. Focus on combination patterns and calculation.',
    [ScoreType.Resourcefulness]: 'After making a mistake, take extra time. Practice defensive puzzles and fortress positions.',
    [ScoreType.AdvantageCapitalization]: 'When ahead, simplify the position. Trade pieces to reach a winning endgame.',
    [ScoreType.TimeManagement]: 'Spend less time in the opening (use prepared lines) and save time for critical middlegame decisions.',
    [ScoreType.Endgame]: 'Study fundamental endgames: King + Pawn, Rook endgames, and basic checkmate patterns.',
  }
  return recs[scoreType]
}

function scoreColor(value: number): string {
  if (value >= 70) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

interface ReportData {
  readonly username: string
  readonly gamesAnalyzed: number
  readonly totalGames: number
  readonly avgAccuracy: number
  readonly winRate: number
  readonly drawRate: number
  readonly lossRate: number
  readonly scores: readonly { scoreType: string; value: number }[]
  readonly openings: readonly { eco: string; games: number; winRate: number }[]
}

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/report')
        const json = await res.json()
        if (json.success) setData(json.data)
      } catch { /* empty */ }
      finally { setLoading(false) }
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

  if (!data || data.totalGames === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <BarChart3 size={48} style={{ color: 'var(--text-muted)' }} />
        <h2 className="mt-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No report data yet</h2>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Import and analyze games to generate your report.</p>
        <Link href="/settings" className="mt-4 rounded-md px-4 py-2 text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>
          Go to Settings
        </Link>
      </div>
    )
  }

  const radarScores = data.scores.map((s) => ({ scoreType: s.scoreType as ScoreType, value: s.value }))
  const sorted = [...data.scores].sort((a, b) => b.value - a.value)

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      {/* Header */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {data.username}
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {data.gamesAnalyzed} of {data.totalGames} games analyzed
            </p>
          </div>
          {data.avgAccuracy > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                {data.avgAccuracy}%
              </span>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Avg Accuracy</p>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {[
            { label: 'Win Rate', value: `${data.winRate}%`, color: 'var(--success)' },
            { label: 'Draw Rate', value: `${data.drawRate}%`, color: 'var(--warning)' },
            { label: 'Loss Rate', value: `${data.lossRate}%`, color: 'var(--danger)' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + Performance bars */}
      {data.scores.length > 0 && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Skill Profile
            </h2>
            <SkillRadar scores={radarScores} />
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Performance by Category
            </h2>
            <div className="space-y-4">
              {sorted.map((score) => {
                const meta = SKILL_META[score.scoreType as ScoreType]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <div key={score.scoreType}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {meta.label}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: scoreColor(score.value) }}>
                        {Math.round(score.value)}
                      </span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${score.value}%`, background: scoreColor(score.value) }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Opening repertoire */}
      {data.openings.length > 0 && (
        <div className="card mb-6 overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Opening Repertoire
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="px-5 py-2.5 text-left font-medium">ECO</th>
                <th className="px-5 py-2.5 text-left font-medium">Games</th>
                <th className="px-5 py-2.5 text-left font-medium">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.openings.map((opening) => (
                <tr key={opening.eco} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{opening.eco}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{opening.games}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: opening.winRate >= 55 ? 'var(--success)' : opening.winRate >= 45 ? 'var(--text-primary)' : 'var(--danger)' }}>
                    {opening.winRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed skill breakdowns */}
      {data.scores.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recommendations
          </h2>
          {sorted.map((score) => {
            const meta = SKILL_META[score.scoreType as ScoreType]
            if (!meta) return null
            const Icon = meta.icon

            return (
              <div key={score.scoreType} className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{meta.label}</h3>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold" style={{ color: scoreColor(score.value) }}>
                      {Math.round(score.value)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="rounded-lg p-3.5" style={{ background: 'var(--accent-light)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                      <Target size={11} />
                      Recommendation
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {getRecommendation(score.scoreType as ScoreType, score.value)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
