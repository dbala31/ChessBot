import { describe, it, expect } from 'vitest'
import { generateDrillsFromMoves } from '../generate'
import { MoveClassification, GamePhase, LessonType } from '@/types'

function makeMoves(
  overrides: Array<{
    ply?: number
    fenBefore?: string
    playedMove?: string
    bestMove?: string
    cpLoss?: number
    classification?: MoveClassification
    phase?: GamePhase
    evalBefore?: number
  }>,
) {
  return overrides.map((o, i) => ({
    ply: o.ply ?? i + 1,
    fenBefore: o.fenBefore ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playedMove: o.playedMove ?? 'e2e4',
    bestMove: o.bestMove ?? 'e2e4',
    cpLoss: o.cpLoss ?? 5,
    classification: o.classification ?? MoveClassification.Best,
    phase: o.phase ?? GamePhase.Middlegame,
    evalBefore: o.evalBefore ?? 50,
  }))
}

describe('generateDrillsFromMoves', () => {
  it('generates puzzles only from mistakes and blunders', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Best, cpLoss: 5 },
      { classification: MoveClassification.Good, cpLoss: 15 },
      { classification: MoveClassification.Inaccuracy, cpLoss: 50 },
      { classification: MoveClassification.Mistake, cpLoss: 120, ply: 4 },
      { classification: MoveClassification.Blunder, cpLoss: 300, ply: 5 },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-1')
    expect(drills).toHaveLength(2)
    expect(drills[0].sourceGameId).toBe('game-1')
  })

  it('sets correct lesson type based on phase and eval', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Blunder, cpLoss: 300, phase: GamePhase.Opening, ply: 1 },
      { classification: MoveClassification.Mistake, cpLoss: 150, phase: GamePhase.Endgame, ply: 2 },
      {
        classification: MoveClassification.Blunder,
        cpLoss: 400,
        phase: GamePhase.Middlegame,
        evalBefore: -200,
        ply: 3,
      },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-2')
    expect(drills).toHaveLength(3)
    expect(drills[0].lessonType).toBe(LessonType.OpeningImprover)
    expect(drills[1].lessonType).toBe(LessonType.EndgameDrill)
    expect(drills[2].lessonType).toBe(LessonType.Defender)
  })

  it('uses bestMove as solution PV', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Blunder, cpLoss: 300, bestMove: 'g1f3', ply: 1 },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-3')
    expect(drills[0].solutionPv).toBe('g1f3')
    expect(drills[0].fen).toBe(moves[0].fenBefore)
  })

  it('sets difficulty from cpLoss', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Mistake, cpLoss: 100, ply: 1 },
      { classification: MoveClassification.Blunder, cpLoss: 500, ply: 2 },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-4')
    // Higher cpLoss = easier puzzle = lower difficulty rating
    expect(drills[0].difficulty).toBeGreaterThan(drills[1].difficulty)
  })

  it('returns empty array when no mistakes', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Best, cpLoss: 5 },
      { classification: MoveClassification.Good, cpLoss: 20 },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-5')
    expect(drills).toEqual([])
  })

  it('caps difficulty between 800 and 2500', () => {
    const moves = makeMoves([
      { classification: MoveClassification.Blunder, cpLoss: 1000, ply: 1 },
      { classification: MoveClassification.Mistake, cpLoss: 81, ply: 2 },
    ])

    const drills = generateDrillsFromMoves(moves, 'game-6')
    expect(drills[0].difficulty).toBeLessThanOrEqual(2500)
    expect(drills[1].difficulty).toBeGreaterThanOrEqual(800)
  })
})
