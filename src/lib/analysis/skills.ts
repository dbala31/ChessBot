import { MoveClassification, GamePhase } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoringMove {
  readonly cpLoss: number
  readonly classification: MoveClassification
  readonly phase: GamePhase
  readonly evalBefore: number
  readonly evalAfter: number
  readonly timeSpent: number | null
}

// ── Rating Benchmarks ─────────────────────────────────────────────────────────
// Expected average cp_loss by rating bracket (based on chess research data).
// A player scoring at their expected level gets ~50. Better = higher. Worse = lower.

const RATING_BENCHMARKS: Record<
  number,
  {
    avgCpLoss: number
    errorRate: number // mistake + blunder rate
    blunderRate: number
    openingCpLoss: number
    endgameCpLoss: number
  }
> = {
  600: {
    avgCpLoss: 200,
    errorRate: 0.45,
    blunderRate: 0.2,
    openingCpLoss: 150,
    endgameCpLoss: 250,
  },
  800: {
    avgCpLoss: 150,
    errorRate: 0.38,
    blunderRate: 0.16,
    openingCpLoss: 120,
    endgameCpLoss: 200,
  },
  1000: {
    avgCpLoss: 110,
    errorRate: 0.32,
    blunderRate: 0.12,
    openingCpLoss: 90,
    endgameCpLoss: 160,
  },
  1200: {
    avgCpLoss: 80,
    errorRate: 0.26,
    blunderRate: 0.09,
    openingCpLoss: 65,
    endgameCpLoss: 120,
  },
  1400: { avgCpLoss: 60, errorRate: 0.2, blunderRate: 0.07, openingCpLoss: 45, endgameCpLoss: 85 },
  1600: { avgCpLoss: 45, errorRate: 0.15, blunderRate: 0.05, openingCpLoss: 35, endgameCpLoss: 60 },
  1800: { avgCpLoss: 35, errorRate: 0.11, blunderRate: 0.03, openingCpLoss: 25, endgameCpLoss: 45 },
  2000: { avgCpLoss: 25, errorRate: 0.08, blunderRate: 0.02, openingCpLoss: 18, endgameCpLoss: 32 },
  2200: { avgCpLoss: 18, errorRate: 0.05, blunderRate: 0.01, openingCpLoss: 12, endgameCpLoss: 22 },
  2400: { avgCpLoss: 12, errorRate: 0.03, blunderRate: 0.005, openingCpLoss: 8, endgameCpLoss: 15 },
}

function getBenchmark(rating: number) {
  const brackets = Object.keys(RATING_BENCHMARKS)
    .map(Number)
    .sort((a, b) => a - b)

  // Find surrounding brackets and interpolate
  let lower = brackets[0]
  let upper = brackets[brackets.length - 1]

  for (let i = 0; i < brackets.length - 1; i++) {
    if (rating >= brackets[i] && rating <= brackets[i + 1]) {
      lower = brackets[i]
      upper = brackets[i + 1]
      break
    }
  }

  if (rating <= lower) return RATING_BENCHMARKS[lower]
  if (rating >= upper) return RATING_BENCHMARKS[upper]

  // Linear interpolation
  const t = (rating - lower) / (upper - lower)
  const lo = RATING_BENCHMARKS[lower]
  const hi = RATING_BENCHMARKS[upper]

  return {
    avgCpLoss: lo.avgCpLoss + (hi.avgCpLoss - lo.avgCpLoss) * t,
    errorRate: lo.errorRate + (hi.errorRate - lo.errorRate) * t,
    blunderRate: lo.blunderRate + (hi.blunderRate - lo.blunderRate) * t,
    openingCpLoss: lo.openingCpLoss + (hi.openingCpLoss - lo.openingCpLoss) * t,
    endgameCpLoss: lo.endgameCpLoss + (hi.endgameCpLoss - lo.endgameCpLoss) * t,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function avgCpLoss(moves: readonly ScoringMove[]): number {
  if (moves.length === 0) return 0
  const total = moves.reduce((sum, m) => sum + m.cpLoss, 0)
  return total / moves.length
}

/**
 * Score relative to rating benchmark.
 * If you're at the expected level for your rating → 50.
 * Better than expected → 50-100. Worse → 0-50.
 */
function relativeScore(actual: number, expected: number): number {
  if (expected <= 0) return 50
  // ratio < 1 means better than expected, > 1 means worse
  const ratio = actual / expected
  // Map: 0 → 100, 0.5 → 75, 1.0 → 50, 1.5 → 25, 2.0+ → 0
  const score = 100 * (1 - ratio / 2)
  return clamp(Math.round(score), 0, 100)
}

// ── Scoring Functions ─────────────────────────────────────────────────────────

const DEFAULT_RATING = 1200

export function computeTactics(
  moves: readonly ScoringMove[],
  rating: number = DEFAULT_RATING,
): number {
  if (moves.length === 0) return 50

  const benchmark = getBenchmark(rating)
  const mistakes = moves.filter(
    (m) =>
      m.classification === MoveClassification.Mistake ||
      m.classification === MoveClassification.Dubious ||
      m.classification === MoveClassification.Miss,
  ).length
  const blunders = moves.filter((m) => m.classification === MoveClassification.Blunder).length
  const errorRate = (mistakes + blunders) / moves.length

  return relativeScore(errorRate, benchmark.errorRate)
}

export function computeEndgame(
  moves: readonly ScoringMove[],
  rating: number = DEFAULT_RATING,
): number {
  const endgameMoves = moves.filter((m) => m.phase === GamePhase.Endgame)
  if (endgameMoves.length === 0) return 50

  const benchmark = getBenchmark(rating)
  return relativeScore(avgCpLoss(endgameMoves), benchmark.endgameCpLoss)
}

export function computeAdvantageCapitalization(
  moves: readonly ScoringMove[],
  rating: number = DEFAULT_RATING,
): number {
  const advantageMoves = moves.filter((m) => m.evalBefore >= 150)
  if (advantageMoves.length === 0) return 50

  const benchmark = getBenchmark(rating)
  return relativeScore(avgCpLoss(advantageMoves), benchmark.avgCpLoss)
}

export function computeResourcefulness(
  moves: readonly ScoringMove[],
  rating: number = DEFAULT_RATING,
): number {
  const defenseMoves = moves.filter((m) => m.evalBefore <= -150)
  if (defenseMoves.length === 0) return 50

  const benchmark = getBenchmark(rating)
  // Defense is harder, use a more forgiving comparison (1.5x the normal benchmark)
  return relativeScore(avgCpLoss(defenseMoves), benchmark.avgCpLoss * 1.5)
}

export function computeTimeManagement(moves: readonly ScoringMove[]): number {
  const timedMoves = moves.filter((m) => m.timeSpent !== null)
  if (timedMoves.length === 0) return 50

  const fastBlunders = timedMoves.filter(
    (m) =>
      m.timeSpent! < 1000 &&
      (m.classification === MoveClassification.Mistake ||
        m.classification === MoveClassification.Blunder),
  )

  const fastBlunderRate = fastBlunders.length / timedMoves.length

  const times = timedMoves.map((m) => m.timeSpent!)
  const mean = times.reduce((a, b) => a + b, 0) / times.length
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0

  const consistencyScore = clamp(Math.round(100 * (1 - cv / 2)), 0, 100)
  const blunderPenalty = Math.round(fastBlunderRate * 50)

  return clamp(consistencyScore - blunderPenalty, 0, 100)
}

export function computeOpeningPerformance(
  moves: readonly ScoringMove[],
  rating: number = DEFAULT_RATING,
): number {
  const openingMoves = moves.filter((m) => m.phase === GamePhase.Opening)
  if (openingMoves.length === 0) return 50

  const benchmark = getBenchmark(rating)
  return relativeScore(avgCpLoss(openingMoves), benchmark.openingCpLoss)
}
