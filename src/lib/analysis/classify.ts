import { MoveClassification, GamePhase } from '@/types'

// ── Move Classification ───────────────────────────────────────────────────────

interface ClassifyInput {
  readonly cpLoss: number
  readonly playedMove: string
  readonly bestMove: string
  readonly evalBefore: number
  readonly evalAfter: number
  readonly phase: GamePhase
  readonly ply: number
  readonly fenBefore: string
}

// Count material from FEN (non-pawn, non-king pieces)
function countMaterial(fen: string): { white: number; black: number } {
  const board = fen.split(' ')[0]
  const values: Record<string, number> = { q: 9, r: 5, b: 3, n: 3 }
  let white = 0
  let black = 0

  for (const char of board) {
    const lower = char.toLowerCase()
    if (lower in values) {
      if (char === char.toUpperCase()) {
        white += values[lower]
      } else {
        black += values[lower]
      }
    }
  }

  return { white, black }
}

// Count total material (including pawns)
function countTotalPieces(fen: string): { white: number; black: number } {
  const board = fen.split(' ')[0]
  const values: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 }
  let white = 0
  let black = 0

  for (const char of board) {
    const lower = char.toLowerCase()
    if (lower in values) {
      if (char === char.toUpperCase()) {
        white += values[lower]
      } else {
        black += values[lower]
      }
    }
  }

  return { white, black }
}

/**
 * Classify a move with the full Chess.com-style system.
 * For backward compatibility, also exports the simple cpLoss-only version.
 */
export function classifyMoveDetailed(input: ClassifyInput): MoveClassification {
  const { cpLoss, playedMove, bestMove, evalBefore, evalAfter, phase, ply, fenBefore } = input
  const loss = Math.max(0, cpLoss)
  const isWhiteToMove = fenBefore.split(' ')[1] === 'w'

  // The played move IS the engine's top choice
  const isBestMove = playedMove === bestMove

  if (isBestMove || loss === 0) {
    // Check for brilliant: best move that involves a sacrifice
    // A sacrifice = material goes down after the move but eval improves or stays strong
    const materialBefore = countTotalPieces(fenBefore)
    const myMaterialBefore = isWhiteToMove ? materialBefore.white : materialBefore.black

    // If eval was already very positive and stays positive, and it's a complex position
    const evalSwing = Math.abs(evalBefore)
    const isTactical = evalSwing > 200 || Math.abs(evalAfter) > 200

    // Simple brilliant detection: played best move in a position where eval swings significantly
    // and there was a big difference between best and second-best (we approximate this with eval magnitude)
    if (isTactical && Math.abs(evalAfter) > Math.abs(evalBefore) + 100 && loss === 0) {
      return MoveClassification.Brilliant
    }

    // Great move: best move in a critical position (large eval, only good option)
    if (loss === 0 && Math.abs(evalBefore) >= 100 && Math.abs(evalBefore) <= 300) {
      return MoveClassification.Great
    }

    // Best move
    return MoveClassification.Best
  }

  // Book move: opening phase, very small loss, early in the game
  if (phase === GamePhase.Opening && ply <= 12 && loss <= 15) {
    return MoveClassification.Book
  }

  // Excellent: very close to best
  if (loss <= 10) {
    return MoveClassification.Excellent
  }

  // Good: acceptable
  if (loss <= 25) {
    return MoveClassification.Good
  }

  // Inaccuracy: slight slip
  if (loss <= 80) {
    return MoveClassification.Inaccuracy
  }

  // Miss: there was a big tactic available (eval was very positive for us) but we didn't find it
  // Specifically: we had a winning advantage and threw it away
  const hadWinningAdvantage = isWhiteToMove ? evalBefore >= 200 : evalBefore <= -200
  const lostAdvantage = isWhiteToMove ? evalAfter <= 50 : evalAfter >= -50
  if (hadWinningAdvantage && lostAdvantage && loss >= 150) {
    return MoveClassification.Miss
  }

  // Dubious: borderline bad move, risky but not clearly a mistake
  if (loss <= 120) {
    return MoveClassification.Dubious
  }

  // Mistake: significant error
  if (loss <= 250) {
    return MoveClassification.Mistake
  }

  // Blunder: catastrophic
  return MoveClassification.Blunder
}

/**
 * Simple classification based only on cpLoss.
 * Used when we don't have full context (backward compat).
 */
export function classifyMove(cpLoss: number): MoveClassification {
  const loss = Math.max(0, cpLoss)

  if (loss <= 5) return MoveClassification.Best
  if (loss <= 15) return MoveClassification.Excellent
  if (loss <= 30) return MoveClassification.Good
  if (loss <= 80) return MoveClassification.Inaccuracy
  if (loss <= 200) return MoveClassification.Mistake
  return MoveClassification.Blunder
}

// ── Phase Detection ───────────────────────────────────────────────────────────

const PIECE_VALUES: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
}

const OPENING_MAX_PLY = 15
const ENDGAME_MATERIAL_THRESHOLD = 13

function countMaterialForPhase(fen: string): number {
  const board = fen.split(' ')[0]
  let material = 0

  for (const char of board) {
    const lower = char.toLowerCase()
    if (lower in PIECE_VALUES) {
      material += PIECE_VALUES[lower]
    }
  }

  return material
}

export function determinePhase(fen: string, ply: number): GamePhase {
  if (ply <= OPENING_MAX_PLY) {
    return GamePhase.Opening
  }

  const material = countMaterialForPhase(fen)

  if (material <= ENDGAME_MATERIAL_THRESHOLD) {
    return GamePhase.Endgame
  }

  return GamePhase.Middlegame
}
