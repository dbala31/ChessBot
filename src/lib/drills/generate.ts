import { MoveClassification, GamePhase, LessonType } from '@/types'

interface AnalyzedMoveInput {
  readonly ply: number
  readonly fenBefore: string
  readonly playedMove: string
  readonly bestMove: string
  readonly cpLoss: number
  readonly classification: MoveClassification
  readonly phase: GamePhase
  readonly evalBefore: number
}

interface GeneratedDrill {
  readonly fen: string
  readonly solutionPv: string
  readonly source: 'own_game'
  readonly sourceGameId: string
  readonly difficulty: number
  readonly lessonType: LessonType
  readonly themeTags: readonly string[]
}

function determineLessonType(
  phase: GamePhase,
  evalBefore: number,
  classification: MoveClassification,
): LessonType {
  // Defending from a worse position
  if (evalBefore <= -150) {
    return LessonType.Defender
  }

  // Phase-based lesson types
  if (phase === GamePhase.Opening) {
    return LessonType.OpeningImprover
  }
  if (phase === GamePhase.Endgame) {
    return LessonType.EndgameDrill
  }

  // Middlegame — based on classification severity
  if (classification === MoveClassification.Blunder) {
    return LessonType.BlunderPreventer
  }

  return LessonType.RetryMistakes
}

function computeDifficulty(cpLoss: number): number {
  // Higher cp_loss = easier puzzle (more obvious), lower cp_loss = harder
  // Map: 80cp → ~1600, 200cp → ~1200, 500cp → ~800
  const raw = Math.round(2000 - cpLoss * 2.4)
  return Math.max(800, Math.min(2500, raw))
}

function determineThemeTags(
  phase: GamePhase,
  evalBefore: number,
  classification: MoveClassification,
): readonly string[] {
  const tags: string[] = [phase, classification]

  if (evalBefore >= 150) tags.push('advantage')
  if (evalBefore <= -150) tags.push('defense')
  if (classification === MoveClassification.Blunder) tags.push('blunder-prevention')

  return tags
}

export function generateDrillsFromMoves(
  moves: readonly AnalyzedMoveInput[],
  gameId: string,
): readonly GeneratedDrill[] {
  return moves
    .filter(
      (m) =>
        m.classification === MoveClassification.Mistake ||
        m.classification === MoveClassification.Blunder ||
        m.classification === MoveClassification.Miss,
    )
    .map(
      (move): GeneratedDrill => ({
        fen: move.fenBefore,
        solutionPv: move.bestMove,
        source: 'own_game',
        sourceGameId: gameId,
        difficulty: computeDifficulty(move.cpLoss),
        lessonType: determineLessonType(move.phase, move.evalBefore, move.classification),
        themeTags: determineThemeTags(move.phase, move.evalBefore, move.classification),
      }),
    )
}
