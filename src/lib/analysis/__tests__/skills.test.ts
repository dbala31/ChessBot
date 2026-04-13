import { describe, it, expect } from 'vitest'
import {
  computeTactics,
  computeEndgame,
  computeAdvantageCapitalization,
  computeResourcefulness,
  computeTimeManagement,
  computeOpeningPerformance,
} from '../skills'
import { MoveClassification, GamePhase } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

interface MockMove {
  readonly cpLoss: number
  readonly classification: MoveClassification
  readonly phase: GamePhase
  readonly evalBefore: number
  readonly evalAfter: number
  readonly timeSpent: number | null
}

function makeMoves(overrides: Partial<MockMove>[]): readonly MockMove[] {
  return overrides.map((o) => ({
    cpLoss: o.cpLoss ?? 5,
    classification: o.classification ?? MoveClassification.Best,
    phase: o.phase ?? GamePhase.Middlegame,
    evalBefore: o.evalBefore ?? 50,
    evalAfter: o.evalAfter ?? 45,
    timeSpent: o.timeSpent ?? null,
  }))
}

// ── computeTactics ────────────────────────────────────────────────────────────

describe('computeTactics', () => {
  it('returns 100 for all best moves', () => {
    const moves = makeMoves(Array(20).fill({ classification: MoveClassification.Best }))
    expect(computeTactics(moves)).toBe(100)
  })

  it('returns 0 for all blunders', () => {
    const moves = makeMoves(
      Array(20).fill({ classification: MoveClassification.Blunder, cpLoss: 300 }),
    )
    expect(computeTactics(moves)).toBe(0)
  })

  it('returns score between 0 and 100 for mixed moves', () => {
    const moves = makeMoves([
      ...Array(18).fill({ classification: MoveClassification.Best }),
      ...Array(1).fill({ classification: MoveClassification.Mistake, cpLoss: 100 }),
      ...Array(1).fill({ classification: MoveClassification.Blunder, cpLoss: 300 }),
    ])
    const score = computeTactics(moves)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('returns 50 when no moves provided', () => {
    expect(computeTactics([])).toBe(50)
  })
})

// ── computeEndgame ────────────────────────────────────────────────────────────

describe('computeEndgame', () => {
  it('returns high score for low cp_loss in endgame', () => {
    const moves = makeMoves(Array(10).fill({ phase: GamePhase.Endgame, cpLoss: 5 }))
    expect(computeEndgame(moves)).toBeGreaterThan(80)
  })

  it('returns low score for high cp_loss in endgame', () => {
    const moves = makeMoves(Array(10).fill({ phase: GamePhase.Endgame, cpLoss: 300 }))
    expect(computeEndgame(moves)).toBeLessThan(30)
  })

  it('returns 50 when no endgame moves', () => {
    const moves = makeMoves(Array(10).fill({ phase: GamePhase.Opening }))
    expect(computeEndgame(moves)).toBe(50)
  })
})

// ── computeAdvantageCapitalization ────────────────────────────────────────────

describe('computeAdvantageCapitalization', () => {
  it('returns high score when advantage is maintained', () => {
    const moves = makeMoves(Array(10).fill({ evalBefore: 200, evalAfter: 190, cpLoss: 10 }))
    expect(computeAdvantageCapitalization(moves)).toBeGreaterThan(80)
  })

  it('returns low score when advantage is squandered', () => {
    const moves = makeMoves(
      Array(10).fill({
        evalBefore: 200,
        evalAfter: -50,
        cpLoss: 250,
        classification: MoveClassification.Blunder,
      }),
    )
    expect(computeAdvantageCapitalization(moves)).toBeLessThan(30)
  })

  it('returns 50 when no advantageous positions', () => {
    const moves = makeMoves(Array(10).fill({ evalBefore: 0, cpLoss: 5 }))
    expect(computeAdvantageCapitalization(moves)).toBe(50)
  })
})

// ── computeResourcefulness ────────────────────────────────────────────────────

describe('computeResourcefulness', () => {
  it('returns high score when defending well from worse positions', () => {
    const moves = makeMoves(Array(10).fill({ evalBefore: -200, cpLoss: 5 }))
    expect(computeResourcefulness(moves)).toBeGreaterThan(80)
  })

  it('returns low score when collapsing from worse positions', () => {
    const moves = makeMoves(
      Array(10).fill({
        evalBefore: -200,
        cpLoss: 200,
        classification: MoveClassification.Blunder,
      }),
    )
    expect(computeResourcefulness(moves)).toBeLessThan(30)
  })

  it('returns 50 when no disadvantageous positions', () => {
    const moves = makeMoves(Array(10).fill({ evalBefore: 100, cpLoss: 5 }))
    expect(computeResourcefulness(moves)).toBe(50)
  })
})

// ── computeTimeManagement ─────────────────────────────────────────────────────

describe('computeTimeManagement', () => {
  it('returns high score for consistent time usage', () => {
    const moves = makeMoves(Array(20).fill({ timeSpent: 10000, cpLoss: 5 }))
    expect(computeTimeManagement(moves)).toBeGreaterThan(70)
  })

  it('returns lower score for erratic time usage with blunders', () => {
    const moves = makeMoves([
      ...Array(10).fill({ timeSpent: 2000, cpLoss: 5 }),
      ...Array(5).fill({ timeSpent: 500, cpLoss: 200, classification: MoveClassification.Blunder }),
      ...Array(5).fill({ timeSpent: 30000, cpLoss: 10 }),
    ])
    const score = computeTimeManagement(moves)
    expect(score).toBeLessThan(80)
  })

  it('returns 50 when no time data available', () => {
    const moves = makeMoves(Array(10).fill({ timeSpent: null }))
    expect(computeTimeManagement(moves)).toBe(50)
  })
})

// ── computeOpeningPerformance ─────────────────────────────────────────────────

describe('computeOpeningPerformance', () => {
  it('returns high score for low cp_loss in opening', () => {
    const moves = makeMoves(Array(15).fill({ phase: GamePhase.Opening, cpLoss: 3 }))
    expect(computeOpeningPerformance(moves)).toBeGreaterThan(80)
  })

  it('returns low score for high cp_loss in opening', () => {
    const moves = makeMoves(Array(15).fill({ phase: GamePhase.Opening, cpLoss: 100 }))
    expect(computeOpeningPerformance(moves)).toBeLessThan(30)
  })

  it('returns 50 when no opening moves', () => {
    const moves = makeMoves(Array(10).fill({ phase: GamePhase.Endgame }))
    expect(computeOpeningPerformance(moves)).toBe(50)
  })
})

// ── Range checks ──────────────────────────────────────────────────────────────

describe('all scoring functions return 0-100', () => {
  const extremeMoves = makeMoves(
    Array(50).fill({
      cpLoss: 500,
      classification: MoveClassification.Blunder,
      phase: GamePhase.Endgame,
      evalBefore: -500,
      evalAfter: -1000,
      timeSpent: 100,
    }),
  )

  const perfectMoves = makeMoves(
    Array(50).fill({
      cpLoss: 0,
      classification: MoveClassification.Best,
      phase: GamePhase.Opening,
      evalBefore: 50,
      evalAfter: 50,
      timeSpent: 10000,
    }),
  )

  const fns = [
    computeTactics,
    computeEndgame,
    computeAdvantageCapitalization,
    computeResourcefulness,
    computeTimeManagement,
    computeOpeningPerformance,
  ]

  for (const fn of fns) {
    it(`${fn.name} stays in 0-100 range with extreme data`, () => {
      const score = fn(extremeMoves)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it(`${fn.name} stays in 0-100 range with perfect data`, () => {
      const score = fn(perfectMoves)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  }
})
