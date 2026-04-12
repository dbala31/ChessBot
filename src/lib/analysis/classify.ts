import { MoveClassification, GamePhase } from '@/types'

// ── Move Classification ───────────────────────────────────────────────────────

// Thresholds in centipawns
const BEST_MAX = 10
const GOOD_MAX = 30
const INACCURACY_MAX = 80
const MISTAKE_MAX = 200

export function classifyMove(cpLoss: number): MoveClassification {
  const loss = Math.max(0, cpLoss)

  if (loss <= BEST_MAX) return MoveClassification.Best
  if (loss <= GOOD_MAX) return MoveClassification.Good
  if (loss <= INACCURACY_MAX) return MoveClassification.Inaccuracy
  if (loss <= MISTAKE_MAX) return MoveClassification.Mistake
  return MoveClassification.Blunder
}

// ── Phase Detection ───────────────────────────────────────────────────────────

// Piece values for material counting (not including kings or pawns)
const PIECE_VALUES: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
}

const OPENING_MAX_PLY = 15
const ENDGAME_MATERIAL_THRESHOLD = 13

function countMaterial(fen: string): number {
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

  const material = countMaterial(fen)

  if (material <= ENDGAME_MATERIAL_THRESHOLD) {
    return GamePhase.Endgame
  }

  return GamePhase.Middlegame
}
