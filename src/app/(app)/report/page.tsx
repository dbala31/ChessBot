'use client'

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
  ChevronRight,
  BarChart3,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  username: 'dbala31',
  source: 'Chess.com' as const,
  gamesAnalyzed: 142,
  ratingRange: { low: 1337, high: 1500 },
  currentRating: 1452,
  ratingTrend: +23,
  avgAccuracy: 82.4,
  avgBlunders: 1.2,
  winRate: 54,
  drawRate: 12,
  lossRate: 34,
}

const MOCK_SCORES = [
  { scoreType: ScoreType.OpeningPerformance, value: 78, percentile: 72, trend: 5 },
  { scoreType: ScoreType.Tactics, value: 72, percentile: 65, trend: -2 },
  { scoreType: ScoreType.Resourcefulness, value: 61, percentile: 55, trend: 8 },
  { scoreType: ScoreType.AdvantageCapitalization, value: 58, percentile: 48, trend: 3 },
  { scoreType: ScoreType.TimeManagement, value: 45, percentile: 35, trend: -5 },
  { scoreType: ScoreType.Endgame, value: 38, percentile: 22, trend: 1 },
]

const SKILL_META: Record<ScoreType, { icon: typeof Swords; label: string; description: string }> = {
  [ScoreType.OpeningPerformance]: { icon: BookOpen, label: 'Opening', description: 'How well you play the first 15 moves' },
  [ScoreType.Tactics]: { icon: Swords, label: 'Tactics', description: 'Ability to find and execute tactical combinations' },
  [ScoreType.Resourcefulness]: { icon: Shield, label: 'Resourcefulness', description: 'How well you defend and fight back from worse positions' },
  [ScoreType.AdvantageCapitalization]: { icon: Trophy, label: 'Advantage Capitalization', description: 'Converting winning positions into actual wins' },
  [ScoreType.TimeManagement]: { icon: Clock, label: 'Time Management', description: 'Clock usage consistency and avoiding time-pressure blunders' },
  [ScoreType.Endgame]: { icon: Crown, label: 'Endgame', description: 'Technique in positions with few pieces remaining' },
}

const MOCK_INSIGHTS: Record<ScoreType, { findings: Array<{ type: 'positive' | 'negative' | 'neutral'; text: string }>; recommendation: string }> = {
  [ScoreType.OpeningPerformance]: {
    findings: [
      { type: 'positive', text: 'With white pieces, you average +0.6 advantage out of the opening — ahead of 72% of players at your rating.' },
      { type: 'neutral', text: 'With black pieces, you exit the opening roughly equal, which is expected.' },
      { type: 'negative', text: 'In the Ruy Lopez: Morphy Defense, you lose -1.05 points on average out of the opening and eventually lose most of these games.' },
      { type: 'positive', text: 'Your Scandinavian Defense gives you +0.95 advantage, but you struggle to convert — study the middlegame plans.' },
    ],
    recommendation: 'Focus on your Ruy Lopez repertoire. Consider switching to the Berlin Defense or studying the Morphy Defense pawn structures.',
  },
  [ScoreType.Tactics]: {
    findings: [
      { type: 'positive', text: 'Your blunder rate (1.2 per game) is better than 65% of players at your level.' },
      { type: 'negative', text: 'You miss tactical opportunities in positions with eval swing >200cp available — found in 23% of your games.' },
      { type: 'neutral', text: 'Most of your tactical errors occur in the middlegame between moves 15-25.' },
    ],
    recommendation: 'Practice tactical puzzles focused on combination patterns. Pay special attention to positions with multiple piece interactions.',
  },
  [ScoreType.Resourcefulness]: {
    findings: [
      { type: 'positive', text: 'When down material or positionally worse, you salvage 31% of games (draw or win) — above average.' },
      { type: 'negative', text: 'Average cp_loss in losing positions is 45cp per move — you sometimes collapse quickly after a mistake.' },
    ],
    recommendation: 'After making a mistake, take extra time on the next few moves. Practice defensive puzzles and study fortress positions.',
  },
  [ScoreType.AdvantageCapitalization]: {
    findings: [
      { type: 'positive', text: 'In 18 games where you had +3.0 or more advantage, you won 17 of them (94%).' },
      { type: 'negative', text: 'In positions with +1.0 to +2.0 advantage, your conversion rate drops to 62% — you leak small advantages.' },
    ],
    recommendation: 'When slightly ahead, simplify the position. Trade pieces to reach a winning endgame rather than overcomplicating.',
  },
  [ScoreType.TimeManagement]: {
    findings: [
      { type: 'negative', text: '18% of your blunders occur with less than 30 seconds on the clock.' },
      { type: 'negative', text: 'Your time usage is erratic — coefficient of variation is 1.8x (ideal is under 1.0x).' },
      { type: 'neutral', text: 'You spend the most time in the opening phase, which may not be optimal.' },
    ],
    recommendation: 'Spend less time in the opening (use prepared lines) and save time for critical middlegame decisions. Set personal time checkpoints.',
  },
  [ScoreType.Endgame]: {
    findings: [
      { type: 'negative', text: 'Your average cp_loss in endgame positions is 62cp — significantly higher than your middlegame (28cp).' },
      { type: 'negative', text: 'You convert winning endgames only 71% of the time vs. 85% average at your rating.' },
      { type: 'positive', text: 'Your king activity improves in the endgame — your king centralization is above average.' },
    ],
    recommendation: 'Study fundamental endgames: King + Pawn, Rook endgames, and basic checkmate patterns. This is your biggest area for improvement.',
  },
}

const MOCK_OPENINGS = [
  { name: 'Sicilian Defense', games: 28, winRate: 61, avgAccuracy: 84, trend: 'up' as const },
  { name: 'Ruy Lopez', games: 22, winRate: 45, avgAccuracy: 76, trend: 'down' as const },
  { name: 'Scandinavian Defense', games: 18, winRate: 56, avgAccuracy: 81, trend: 'up' as const },
  { name: "Queen's Gambit Declined", games: 15, winRate: 53, avgAccuracy: 79, trend: 'flat' as const },
  { name: 'Italian Game', games: 14, winRate: 64, avgAccuracy: 87, trend: 'up' as const },
  { name: 'Caro-Kann Defense', games: 12, winRate: 42, avgAccuracy: 73, trend: 'down' as const },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(value: number): string {
  if (value >= 70) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function trendIcon(trend: number) {
  if (trend > 0) return <ArrowUpRight size={12} style={{ color: 'var(--success)' }} />
  if (trend < 0) return <ArrowDownRight size={12} style={{ color: 'var(--danger)' }} />
  return <Minus size={12} style={{ color: 'var(--text-muted)' }} />
}

function findingIcon(type: 'positive' | 'negative' | 'neutral') {
  if (type === 'positive') return <TrendingUp size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
  if (type === 'negative') return <TrendingDown size={14} style={{ color: 'var(--danger)', flexShrink: 0 }} />
  return <Minus size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const sorted = [...MOCK_SCORES].sort((a, b) => b.value - a.value)

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      {/* Header */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {MOCK_PROFILE.username}
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              {MOCK_PROFILE.gamesAnalyzed} games analyzed on {MOCK_PROFILE.source}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {MOCK_PROFILE.currentRating}
              </span>
              <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color: MOCK_PROFILE.ratingTrend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {MOCK_PROFILE.ratingTrend >= 0 ? '+' : ''}{MOCK_PROFILE.ratingTrend}
                {MOCK_PROFILE.ratingTrend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Current Rating</p>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mt-5 grid grid-cols-4 gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          {[
            { label: 'Avg Accuracy', value: `${MOCK_PROFILE.avgAccuracy}%`, color: 'var(--accent)' },
            { label: 'Win Rate', value: `${MOCK_PROFILE.winRate}%`, color: 'var(--success)' },
            { label: 'Draw Rate', value: `${MOCK_PROFILE.drawRate}%`, color: 'var(--warning)' },
            { label: 'Loss Rate', value: `${MOCK_PROFILE.lossRate}%`, color: 'var(--danger)' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Radar + Performance bars side by side */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Radar chart */}
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Skill Profile
          </h2>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Compared to players rated {MOCK_PROFILE.ratingRange.low}–{MOCK_PROFILE.ratingRange.high}
          </p>
          <SkillRadar scores={MOCK_SCORES} />
        </div>

        {/* Performance bars */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Performance by Category
          </h2>
          <div className="space-y-4">
            {sorted.map((score) => {
              const meta = SKILL_META[score.scoreType]
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: scoreColor(score.value) }}>
                        {score.value}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px]" style={{ color: score.trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {score.trend >= 0 ? '+' : ''}{score.trend}
                        {trendIcon(score.trend)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score.value}%`, background: scoreColor(score.value) }}
                    />
                    {/* Percentile marker */}
                    <div
                      className="absolute top-0 h-full w-px"
                      style={{ left: `${score.percentile}%`, background: 'var(--text-muted)', opacity: 0.5 }}
                      title={`${score.percentile}th percentile`}
                    />
                  </div>
                  <p className="mt-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {score.percentile}th percentile at your rating
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Opening repertoire */}
      <div className="card mb-6 overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Opening Repertoire
          </h2>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Your most played openings and performance
          </p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th className="px-5 py-2.5 text-left font-medium">Opening</th>
              <th className="px-5 py-2.5 text-left font-medium">Games</th>
              <th className="px-5 py-2.5 text-left font-medium">Win Rate</th>
              <th className="px-5 py-2.5 text-left font-medium">Accuracy</th>
              <th className="px-5 py-2.5 text-left font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_OPENINGS.map((opening) => (
              <tr key={opening.name} className="cursor-pointer transition-colors duration-100" style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{opening.name}</td>
                <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>{opening.games}</td>
                <td className="px-5 py-3 font-medium" style={{ color: opening.winRate >= 55 ? 'var(--success)' : opening.winRate >= 45 ? 'var(--text-primary)' : 'var(--danger)' }}>
                  {opening.winRate}%
                </td>
                <td className="px-5 py-3" style={{ color: opening.avgAccuracy >= 80 ? 'var(--success)' : 'var(--text-secondary)' }}>
                  {opening.avgAccuracy}%
                </td>
                <td className="px-5 py-3">
                  {opening.trend === 'up' && <TrendingUp size={14} style={{ color: 'var(--success)' }} />}
                  {opening.trend === 'down' && <TrendingDown size={14} style={{ color: 'var(--danger)' }} />}
                  {opening.trend === 'flat' && <Minus size={14} style={{ color: 'var(--text-muted)' }} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed skill breakdowns */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Detailed Analysis
        </h2>

        {sorted.map((score) => {
          const meta = SKILL_META[score.scoreType]
          const insights = MOCK_INSIGHTS[score.scoreType]
          const Icon = meta.icon

          return (
            <div key={score.scoreType} className="card overflow-hidden">
              {/* Skill header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {meta.label}
                    </h3>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {meta.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xl font-bold" style={{ color: scoreColor(score.value) }}>
                      {score.value}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/100</span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{
                      background: `conic-gradient(${scoreColor(score.value)} ${score.value * 3.6}deg, var(--bg-tertiary) 0)`,
                    }}
                  >
                    <div
                      className="m-[3px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[9px] font-bold"
                      style={{ background: 'var(--bg-primary)', color: scoreColor(score.value) }}
                    >
                      {score.percentile}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Findings */}
              <div className="px-5 py-4">
                <div className="space-y-3">
                  {insights.findings.map((finding, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="mt-0.5">{findingIcon(finding.type)}</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {finding.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div
                  className="mt-4 rounded-lg p-3.5"
                  style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)', borderColor: 'rgba(124, 58, 237, 0.2)' }}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    <Target size={11} />
                    Recommendation
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {insights.recommendation}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
