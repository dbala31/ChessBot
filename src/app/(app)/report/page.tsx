'use client'

import { useState, useEffect } from 'react'
import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import {
  Swords, Crown, Clock, BookOpen, Shield, Trophy, BarChart3, Target,
  Loader2, AlertTriangle, TrendingUp, TrendingDown, Zap,
} from 'lucide-react'
import Link from 'next/link'

const SKILL_META: Record<ScoreType, { icon: typeof Swords; label: string; description: string }> = {
  [ScoreType.OpeningPerformance]: { icon: BookOpen, label: 'Opening', description: 'How well you play the first 15 moves' },
  [ScoreType.Tactics]: { icon: Swords, label: 'Tactics', description: 'Ability to avoid mistakes and blunders' },
  [ScoreType.Resourcefulness]: { icon: Shield, label: 'Resourcefulness', description: 'How well you defend from worse positions' },
  [ScoreType.AdvantageCapitalization]: { icon: Trophy, label: 'Advantage Capitalization', description: 'Converting winning positions into actual wins' },
  [ScoreType.TimeManagement]: { icon: Clock, label: 'Time Management', description: 'Clock usage consistency' },
  [ScoreType.Endgame]: { icon: Crown, label: 'Endgame', description: 'Technique with few pieces remaining' },
}

function scoreColor(value: number): string {
  if (value >= 70) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function scoreLabel(value: number): string {
  if (value >= 80) return 'Excellent for your level'
  if (value >= 60) return 'Above average for your level'
  if (value >= 45) return 'Average for your level'
  if (value >= 30) return 'Below average — focus area'
  return 'Needs significant work'
}

interface ReportData {
  username: string
  currentRating: number | null
  targetRating: number | null
  gamesAnalyzed: number
  totalGames: number
  avgAccuracy: number
  avgCpLoss: number
  winRate: number
  drawRate: number
  lossRate: number
  totalBlunders: number
  totalMistakes: number
  totalBestMoves: number
  totalMoves: number
  scores: { scoreType: string; value: number }[]
  phaseStats: { phase: string; moveCount: number; avgCpLoss: number; blunders: number; mistakes: number; bestMoves: number; accuracy: number }[]
  openings: { eco: string; games: number; winRate: number; avgCpLoss: number }[]
  blunderPatterns: { byPhase: { opening: number; middlegame: number; endgame: number }; fromWinning: number; fromEqual: number; fromLosing: number; total: number }
  advantageConversion: { movesInAdvantage: number; errorsInAdvantage: number; accuracy: number }
  defense: { movesDefending: number; errorsDefending: number; accuracy: number }
}

function getDetailedInsight(scoreType: ScoreType, value: number, data: ReportData): string[] {
  const insights: string[] = []
  const rating = data.currentRating ?? 1200
  const target = data.targetRating ?? rating + 200

  switch (scoreType) {
    case ScoreType.Tactics: {
      const errorRate = data.totalMoves > 0 ? ((data.totalMistakes + data.totalBlunders) / data.totalMoves * 100).toFixed(1) : '0'
      const blunderRate = data.totalMoves > 0 ? (data.totalBlunders / data.totalMoves * 100).toFixed(1) : '0'
      insights.push(`Your error rate (mistakes + blunders) is ${errorRate}% across ${data.totalMoves} analyzed moves.`)
      insights.push(`Blunder rate specifically: ${blunderRate}% (${data.totalBlunders} blunders in ${data.gamesAnalyzed} games — avg ${(data.totalBlunders / Math.max(1, data.gamesAnalyzed)).toFixed(1)} per game).`)
      insights.push(`Best moves played: ${data.totalBestMoves} (${data.totalMoves > 0 ? (data.totalBestMoves / data.totalMoves * 100).toFixed(0) : 0}% of all moves).`)
      if (value < 40) insights.push(`To reach ${target}, aim to reduce your blunder rate by about half. Daily tactical puzzles (15-20 min) focused on pattern recognition will help.`)
      break
    }
    case ScoreType.OpeningPerformance: {
      const openingPhase = data.phaseStats.find((p) => p.phase === 'opening')
      if (openingPhase) {
        insights.push(`Average centipawn loss in the opening: ${openingPhase.avgCpLoss}cp across ${openingPhase.moveCount} opening moves.`)
        insights.push(`Opening accuracy: ${openingPhase.accuracy}%. Blunders in opening: ${openingPhase.blunders}, Mistakes: ${openingPhase.mistakes}.`)
      }
      const bestOpening = data.openings.reduce((best, o) => o.winRate > (best?.winRate ?? 0) ? o : best, data.openings[0])
      const worstOpening = data.openings.reduce((worst, o) => o.winRate < (worst?.winRate ?? 100) && o.games >= 3 ? o : worst, data.openings[0])
      if (bestOpening) insights.push(`Best opening: ${bestOpening.eco} (${bestOpening.winRate}% win rate across ${bestOpening.games} games).`)
      if (worstOpening && worstOpening.eco !== bestOpening?.eco) insights.push(`Weakest opening: ${worstOpening.eco} (${worstOpening.winRate}% win rate across ${worstOpening.games} games) — consider studying this or switching.`)
      break
    }
    case ScoreType.Endgame: {
      const endPhase = data.phaseStats.find((p) => p.phase === 'endgame')
      if (endPhase && endPhase.moveCount > 0) {
        insights.push(`Endgame accuracy: ${endPhase.accuracy}% across ${endPhase.moveCount} endgame moves.`)
        insights.push(`Endgame avg cp loss: ${endPhase.avgCpLoss}cp. Blunders: ${endPhase.blunders}, Mistakes: ${endPhase.mistakes}.`)
        const midPhase = data.phaseStats.find((p) => p.phase === 'middlegame')
        if (midPhase && midPhase.avgCpLoss > 0) {
          const ratio = (endPhase.avgCpLoss / midPhase.avgCpLoss).toFixed(1)
          insights.push(`Your endgame cp loss is ${ratio}x your middlegame — ${Number(ratio) > 1.5 ? 'endgames are clearly your weakest phase' : 'fairly consistent across phases'}.`)
        }
      } else {
        insights.push('Not enough endgame positions in your analyzed games to give detailed feedback.')
      }
      if (value < 40) insights.push('Study King + Pawn endgames, Rook endgames (Lucena/Philidor), and basic checkmate patterns. These come up constantly.')
      break
    }
    case ScoreType.AdvantageCapitalization: {
      const adv = data.advantageConversion
      if (adv.movesInAdvantage > 0) {
        insights.push(`When you had a winning advantage (+1.5 or more): ${adv.accuracy}% accuracy across ${adv.movesInAdvantage} moves.`)
        insights.push(`Errors while winning: ${adv.errorsInAdvantage} (${(adv.errorsInAdvantage / adv.movesInAdvantage * 100).toFixed(0)}% of winning moves were mistakes/blunders).`)
        if (data.blunderPatterns.fromWinning > 0) {
          insights.push(`${data.blunderPatterns.fromWinning} of your ${data.blunderPatterns.total} blunders came from winning positions — you're throwing away games you should win.`)
        }
      }
      if (value < 40) insights.push('When ahead, simplify! Trade pieces, avoid complications, and convert to a winning endgame. Think "safe and solid" not "flashy".')
      break
    }
    case ScoreType.Resourcefulness: {
      const def = data.defense
      if (def.movesDefending > 0) {
        insights.push(`When defending from worse positions (-1.5 or more): ${def.accuracy}% accuracy across ${def.movesDefending} moves.`)
        insights.push(`Errors while defending: ${def.errorsDefending} — ${def.accuracy >= 70 ? 'you fight well from bad positions' : 'you tend to collapse when behind'}.`)
      }
      if (value < 30) insights.push('After making a mistake, slow down. Take 10-15 extra seconds on the next few moves. Look for fortress positions and counterplay rather than panicking.')
      break
    }
    case ScoreType.TimeManagement: {
      insights.push('Time management is scored based on consistency of move time and avoiding fast blunders (moves under 1 second that are mistakes/blunders).')
      if (value >= 50) insights.push('Your time usage is relatively consistent — keep it up.')
      else insights.push('Your time usage is erratic. Try to distribute time more evenly — spend less in the opening, save more for critical middlegame decisions.')
      break
    }
  }

  return insights
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
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} /></div>
  }

  if (!data || data.totalGames === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <BarChart3 size={48} style={{ color: 'var(--text-muted)' }} />
        <h2 className="mt-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No report data yet</h2>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Import and analyze games to generate your report.</p>
        <Link href="/settings" className="mt-4 rounded-md px-4 py-2 text-xs font-medium text-white" style={{ background: 'var(--accent)' }}>Go to Settings</Link>
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
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{data.username}</h1>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {data.gamesAnalyzed} of {data.totalGames} games analyzed
              {data.currentRating && ` · Rated ${data.currentRating}`}
              {data.targetRating && ` · Target: ${data.targetRating}`}
            </p>
          </div>
          {data.avgAccuracy > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{data.avgAccuracy}%</span>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Avg Accuracy</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {[
            { label: 'Win Rate', value: `${data.winRate}%`, color: 'var(--success)' },
            { label: 'Draw Rate', value: `${data.drawRate}%`, color: 'var(--warning)' },
            { label: 'Loss Rate', value: `${data.lossRate}%`, color: 'var(--danger)' },
            { label: 'Avg CP Loss', value: `${data.avgCpLoss}`, color: 'var(--accent)' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Move classification breakdown */}
        <div className="mt-4 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--success)' }}>{data.totalBestMoves}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Best Moves ({data.totalMoves > 0 ? Math.round(data.totalBestMoves / data.totalMoves * 100) : 0}%)</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--warning)' }}>{data.totalMistakes}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mistakes ({data.totalMoves > 0 ? Math.round(data.totalMistakes / data.totalMoves * 100) : 0}%)</p>
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--danger)' }}>{data.totalBlunders}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Blunders ({data.totalMoves > 0 ? Math.round(data.totalBlunders / data.totalMoves * 100) : 0}%)</p>
          </div>
        </div>
      </div>

      {/* Phase breakdown */}
      {data.phaseStats.some((p) => p.moveCount > 0) && (
        <div className="card mb-6 p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Performance by Game Phase</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.phaseStats.filter((p) => p.moveCount > 0).map((phase) => (
              <div key={phase.phase} className="rounded-lg p-4" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <h3 className="mb-2 text-xs font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{phase.phase}</h3>
                <p className="text-xl font-bold" style={{ color: scoreColor(phase.accuracy) }}>{phase.accuracy}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>accuracy · {phase.moveCount} moves</p>
                <div className="mt-2 space-y-1 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex justify-between"><span>Avg CP Loss</span><span className="font-medium">{phase.avgCpLoss}</span></div>
                  <div className="flex justify-between"><span>Blunders</span><span className="font-medium" style={{ color: phase.blunders > 0 ? 'var(--danger)' : 'var(--success)' }}>{phase.blunders}</span></div>
                  <div className="flex justify-between"><span>Best Moves</span><span className="font-medium" style={{ color: 'var(--success)' }}>{phase.bestMoves}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blunder patterns */}
      {data.blunderPatterns.total > 0 && (
        <div className="card mb-6 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} /> Blunder Analysis
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>When do you blunder?</p>
              {Object.entries(data.blunderPatterns.byPhase).map(([phase, count]) => (
                <div key={phase} className="mb-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${data.blunderPatterns.total > 0 ? (count / data.blunderPatterns.total) * 100 : 0}%`, background: 'var(--danger)' }} />
                  </div>
                  <span className="w-24 text-[10px] capitalize" style={{ color: 'var(--text-secondary)' }}>{phase}: {count}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Position when blundering</p>
              <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex justify-between"><span>From winning positions</span><span className="font-medium" style={{ color: 'var(--danger)' }}>{data.blunderPatterns.fromWinning}</span></div>
                <div className="flex justify-between"><span>From equal positions</span><span className="font-medium" style={{ color: 'var(--warning)' }}>{data.blunderPatterns.fromEqual}</span></div>
                <div className="flex justify-between"><span>From losing positions</span><span className="font-medium" style={{ color: 'var(--text-muted)' }}>{data.blunderPatterns.fromLosing}</span></div>
              </div>
              {data.blunderPatterns.fromWinning > data.blunderPatterns.total * 0.3 && (
                <p className="mt-2 text-[10px] font-medium" style={{ color: 'var(--danger)' }}>
                  {Math.round(data.blunderPatterns.fromWinning / data.blunderPatterns.total * 100)}% of blunders happen when you're winning — you're throwing away won games!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Radar + skill bars */}
      {data.scores.length > 0 && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Skill Profile {data.currentRating && <span className="font-normal" style={{ color: 'var(--text-muted)' }}>(vs {data.currentRating}-rated peers)</span>}
            </h2>
            <SkillRadar scores={radarScores} />
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Performance by Category</h2>
            <div className="space-y-4">
              {sorted.map((score) => {
                const meta = SKILL_META[score.scoreType as ScoreType]
                if (!meta) return null
                const Icon = meta.icon
                return (
                  <div key={score.scoreType}>
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={14} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{meta.label}</span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: scoreColor(score.value) }}>{Math.round(score.value)}</span>
                    </div>
                    <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score.value}%`, background: scoreColor(score.value) }} />
                      {/* 50 marker = average for your rating */}
                      <div className="absolute top-0 h-full w-px" style={{ left: '50%', background: 'var(--text-muted)', opacity: 0.4 }} title="Average for your rating" />
                    </div>
                    <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>{scoreLabel(score.value)} · 50 = average at your rating</p>
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
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Opening Repertoire</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th className="px-5 py-2.5 text-left font-medium">ECO</th>
                <th className="px-5 py-2.5 text-left font-medium">Games</th>
                <th className="px-5 py-2.5 text-left font-medium">Win Rate</th>
                <th className="px-5 py-2.5 text-left font-medium">Avg CP Loss</th>
              </tr>
            </thead>
            <tbody>
              {data.openings.map((opening) => (
                <tr key={opening.eco} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{opening.eco}</td>
                  <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{opening.games}</td>
                  <td className="px-5 py-3 font-medium" style={{ color: opening.winRate >= 55 ? 'var(--success)' : opening.winRate >= 45 ? 'var(--text-primary)' : 'var(--danger)' }}>{opening.winRate}%</td>
                  <td className="px-5 py-3" style={{ color: opening.avgCpLoss <= 50 ? 'var(--success)' : 'var(--warning)' }}>{opening.avgCpLoss}cp</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed skill breakdowns */}
      {data.scores.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Detailed Analysis & Recommendations</h2>
          {sorted.map((score) => {
            const meta = SKILL_META[score.scoreType as ScoreType]
            if (!meta) return null
            const Icon = meta.icon
            const insights = getDetailedInsight(score.scoreType as ScoreType, score.value, data)

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
                    <span className="text-xl font-bold" style={{ color: scoreColor(score.value) }}>{Math.round(score.value)}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <div className="space-y-2">
                    {insights.map((insight, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="mt-0.5">
                          {i === insights.length - 1 && score.value < 50 ? (
                            <Target size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                          ) : (
                            <Zap size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{insight}</p>
                      </div>
                    ))}
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
