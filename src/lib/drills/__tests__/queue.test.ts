import { describe, it, expect } from 'vitest'
import { buildDrillQueue } from '../queue'
import { ScoreType, LessonType } from '@/types'

interface MockPuzzle {
  readonly id: string
  readonly lessonType: LessonType
  readonly difficulty: number
}

function makePuzzles(count: number, lessonType: LessonType): readonly MockPuzzle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${lessonType}-${i}`,
    lessonType,
    difficulty: 1200 + i * 50,
  }))
}

const MOCK_SCORES = [
  { scoreType: ScoreType.Tactics, value: 72 },
  { scoreType: ScoreType.Endgame, value: 38 },
  { scoreType: ScoreType.AdvantageCapitalization, value: 61 },
  { scoreType: ScoreType.Resourcefulness, value: 45 },
  { scoreType: ScoreType.TimeManagement, value: 55 },
  { scoreType: ScoreType.OpeningPerformance, value: 78 },
]

const ALL_PUZZLES = [
  ...makePuzzles(10, LessonType.Tactics),
  ...makePuzzles(10, LessonType.EndgameDrill),
  ...makePuzzles(10, LessonType.AdvantageCapitalization),
  ...makePuzzles(10, LessonType.Defender),
  ...makePuzzles(10, LessonType.OpeningImprover),
  ...makePuzzles(10, LessonType.RetryMistakes),
]

describe('buildDrillQueue', () => {
  it('returns exactly 15 drills by default', () => {
    const queue = buildDrillQueue(ALL_PUZZLES, MOCK_SCORES, [], 15)
    expect(queue).toHaveLength(15)
  })

  it('weighs weakest skills more heavily', () => {
    const queue = buildDrillQueue(ALL_PUZZLES, MOCK_SCORES, [], 15)
    // Endgame (38) and Resourcefulness (45) are weakest
    // Their related lesson types should appear more
    const endgameCount = queue.filter((p) => p.lessonType === LessonType.EndgameDrill).length
    const tacticsCount = queue.filter((p) => p.lessonType === LessonType.Tactics).length
    expect(endgameCount).toBeGreaterThanOrEqual(tacticsCount)
  })

  it('excludes recently attempted puzzles', () => {
    const recentIds = ALL_PUZZLES.slice(0, 20).map((p) => p.id)
    const queue = buildDrillQueue(ALL_PUZZLES, MOCK_SCORES, recentIds, 15)
    const overlap = queue.filter((p) => recentIds.includes(p.id))
    expect(overlap).toHaveLength(0)
  })

  it('returns fewer drills if not enough puzzles available', () => {
    const smallPool = makePuzzles(3, LessonType.Tactics)
    const queue = buildDrillQueue(smallPool, MOCK_SCORES, [], 15)
    expect(queue).toHaveLength(3)
  })

  it('returns empty array when no puzzles available', () => {
    const queue = buildDrillQueue([], MOCK_SCORES, [], 15)
    expect(queue).toEqual([])
  })

  it('does not include duplicates', () => {
    const queue = buildDrillQueue(ALL_PUZZLES, MOCK_SCORES, [], 15)
    const ids = queue.map((p) => p.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})
