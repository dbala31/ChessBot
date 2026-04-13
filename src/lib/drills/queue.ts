import { ScoreType, LessonType } from '@/types'

interface PuzzleInput {
  readonly id: string
  readonly lessonType: LessonType
  readonly difficulty: number
}

interface SkillScoreInput {
  readonly scoreType: ScoreType
  readonly value: number
}

// Map each ScoreType to its primary LessonType
const SCORE_TO_LESSON: Record<ScoreType, LessonType> = {
  [ScoreType.Tactics]: LessonType.Tactics,
  [ScoreType.Endgame]: LessonType.EndgameDrill,
  [ScoreType.AdvantageCapitalization]: LessonType.AdvantageCapitalization,
  [ScoreType.Resourcefulness]: LessonType.Defender,
  [ScoreType.TimeManagement]: LessonType.RetryMistakes,
  [ScoreType.OpeningPerformance]: LessonType.OpeningImprover,
}

/**
 * Build a daily drill queue weighted toward weakest skills.
 *
 * Distribution: 50% weakest 2 skills, 30% remaining skills, 20% variety
 */
export function buildDrillQueue<T extends PuzzleInput>(
  availablePuzzles: readonly T[],
  scores: readonly SkillScoreInput[],
  recentlyAttemptedIds: readonly string[],
  targetCount: number,
): readonly T[] {
  const recentSet = new Set(recentlyAttemptedIds)
  const eligible = availablePuzzles.filter((p) => !recentSet.has(p.id))

  if (eligible.length === 0) return []

  // Sort scores by value (weakest first)
  const sorted = [...scores].sort((a, b) => a.value - b.value)
  const weakest2 = sorted.slice(0, 2).map((s) => SCORE_TO_LESSON[s.scoreType])
  const remaining = sorted.slice(2).map((s) => SCORE_TO_LESSON[s.scoreType])

  // Allocate counts
  const weakestCount = Math.ceil(targetCount * 0.5)
  const remainingCount = Math.ceil(targetCount * 0.3)
  const varietyCount = targetCount - weakestCount - remainingCount

  const selected: T[] = []
  const usedIds = new Set<string>()

  function pickFromPool(pool: readonly T[], count: number) {
    // Shuffle pool for variety
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    let picked = 0
    for (const puzzle of shuffled) {
      if (picked >= count) break
      if (usedIds.has(puzzle.id)) continue
      selected.push(puzzle)
      usedIds.add(puzzle.id)
      picked++
    }
  }

  // 50% from weakest 2 skills
  const weakestPool = eligible.filter((p) => weakest2.includes(p.lessonType))
  pickFromPool(weakestPool, weakestCount)

  // 30% from remaining skills
  const remainingPool = eligible.filter((p) => remaining.includes(p.lessonType))
  pickFromPool(remainingPool, remainingCount)

  // 20% variety (anything not yet picked)
  const varietyPool = eligible.filter((p) => !usedIds.has(p.id))
  pickFromPool(varietyPool, varietyCount)

  // If we're short, fill from any remaining eligible
  if (selected.length < targetCount) {
    const fillPool = eligible.filter((p) => !usedIds.has(p.id))
    pickFromPool(fillPool, targetCount - selected.length)
  }

  return selected
}
