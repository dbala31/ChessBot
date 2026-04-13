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

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_SCORE = 50

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function avgCpLoss(moves: readonly ScoringMove[]): number {
  if (moves.length === 0) return 0
  const total = moves.reduce((sum, m) => sum + m.cpLoss, 0)
  return total / moves.length
}

/** Convert average cp_loss to a 0–100 score. Lower loss = higher score.
 *  Uses a curve that's more forgiving — an avg of ~30cp maps to ~75, ~80cp to ~50, ~200cp to ~15.
 */
function cpLossToScore(avg: number): number {
  if (avg <= 0) return 100
  // Exponential decay: score = 100 * e^(-avg/120)
  // This gives: 30cp → 78, 50cp → 66, 80cp → 51, 120cp → 37, 200cp → 19
  return clamp(Math.round(100 * Math.exp(-avg / 120)), 0, 100)
}

// ── Scoring Functions ─────────────────────────────────────────────────────────

/**
 * Tactics: weighted error score. Blunders penalized more than mistakes.
 * A typical club player has ~15-25% error rate; this should map to ~40-60.
 */
export function computeTactics(moves: readonly ScoringMove[]): number {
  if (moves.length === 0) return DEFAULT_SCORE

  const mistakes = moves.filter((m) => m.classification === MoveClassification.Mistake).length
  const blunders = moves.filter((m) => m.classification === MoveClassification.Blunder).length

  // Weighted error rate: blunders count 2x
  const weightedErrors = mistakes + blunders * 2
  const weightedRate = weightedErrors / moves.length

  // Use exponential decay: 0% errors → 100, 15% → 65, 30% → 42, 50% → 22
  return clamp(Math.round(100 * Math.exp(-weightedRate * 3)), 0, 100)
}

/**
 * Endgame: average cp_loss in endgame positions.
 */
export function computeEndgame(moves: readonly ScoringMove[]): number {
  const endgameMoves = moves.filter((m) => m.phase === GamePhase.Endgame)
  if (endgameMoves.length === 0) return DEFAULT_SCORE

  return cpLossToScore(avgCpLoss(endgameMoves))
}

/**
 * Advantage capitalization: how well you maintain/convert when eval > +150cp.
 */
export function computeAdvantageCapitalization(moves: readonly ScoringMove[]): number {
  const advantageMoves = moves.filter((m) => m.evalBefore >= 150)
  if (advantageMoves.length === 0) return DEFAULT_SCORE

  return cpLossToScore(avgCpLoss(advantageMoves))
}

/**
 * Resourcefulness: how well you play when eval < -150cp (defending).
 */
export function computeResourcefulness(moves: readonly ScoringMove[]): number {
  const defenseMoves = moves.filter((m) => m.evalBefore <= -150)
  if (defenseMoves.length === 0) return DEFAULT_SCORE

  // Defensive positions naturally have higher cp_loss, so use a gentler curve
  const avg = avgCpLoss(defenseMoves)
  return clamp(Math.round(100 * Math.exp(-avg / 200)), 0, 100)
}

/**
 * Time management: consistency of time usage + avoiding fast blunders.
 * Penalizes moves made in < 1s that result in mistakes/blunders.
 */
export function computeTimeManagement(moves: readonly ScoringMove[]): number {
  const timedMoves = moves.filter((m) => m.timeSpent !== null)
  if (timedMoves.length === 0) return DEFAULT_SCORE

  // Penalty for fast blunders (< 1 second)
  const fastBlunders = timedMoves.filter(
    (m) =>
      m.timeSpent! < 1000 &&
      (m.classification === MoveClassification.Mistake ||
        m.classification === MoveClassification.Blunder),
  )

  const fastBlunderRate = fastBlunders.length / timedMoves.length

  // Consistency: coefficient of variation of time spent
  const times = timedMoves.map((m) => m.timeSpent!)
  const mean = times.reduce((a, b) => a + b, 0) / times.length
  const variance = times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0

  // High CV = erratic, penalize. Fast blunders also penalize.
  const consistencyScore = clamp(Math.round(100 * (1 - cv / 2)), 0, 100)
  const blunderPenalty = Math.round(fastBlunderRate * 50)

  return clamp(consistencyScore - blunderPenalty, 0, 100)
}

/**
 * Opening performance: average cp_loss in the first 15 moves (opening phase).
 */
export function computeOpeningPerformance(moves: readonly ScoringMove[]): number {
  const openingMoves = moves.filter((m) => m.phase === GamePhase.Opening)
  if (openingMoves.length === 0) return DEFAULT_SCORE

  return cpLossToScore(avgCpLoss(openingMoves))
}
