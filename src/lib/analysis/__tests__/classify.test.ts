import { describe, it, expect } from 'vitest'
import { classifyMove, determinePhase } from '../classify'
import { MoveClassification, GamePhase } from '@/types'

// ── classifyMove ──────────────────────────────────────────────────────────────

describe('classifyMove', () => {
  it('classifies 0 cp loss as best', () => {
    expect(classifyMove(0)).toBe(MoveClassification.Best)
  })

  it('classifies 5 cp loss as best', () => {
    expect(classifyMove(5)).toBe(MoveClassification.Best)
  })

  it('classifies 10 cp loss as best (upper boundary)', () => {
    expect(classifyMove(10)).toBe(MoveClassification.Best)
  })

  it('classifies 11 cp loss as good', () => {
    expect(classifyMove(11)).toBe(MoveClassification.Good)
  })

  it('classifies 30 cp loss as good (upper boundary)', () => {
    expect(classifyMove(30)).toBe(MoveClassification.Good)
  })

  it('classifies 31 cp loss as inaccuracy', () => {
    expect(classifyMove(31)).toBe(MoveClassification.Inaccuracy)
  })

  it('classifies 80 cp loss as inaccuracy (upper boundary)', () => {
    expect(classifyMove(80)).toBe(MoveClassification.Inaccuracy)
  })

  it('classifies 81 cp loss as mistake', () => {
    expect(classifyMove(81)).toBe(MoveClassification.Mistake)
  })

  it('classifies 200 cp loss as mistake (upper boundary)', () => {
    expect(classifyMove(200)).toBe(MoveClassification.Mistake)
  })

  it('classifies 201 cp loss as blunder', () => {
    expect(classifyMove(201)).toBe(MoveClassification.Blunder)
  })

  it('classifies 500 cp loss as blunder', () => {
    expect(classifyMove(500)).toBe(MoveClassification.Blunder)
  })

  it('treats negative cp loss as best (opponent blundered)', () => {
    expect(classifyMove(-50)).toBe(MoveClassification.Best)
  })
})

// ── determinePhase ────────────────────────────────────────────────────────────

describe('determinePhase', () => {
  it('classifies starting position as opening', () => {
    expect(
      determinePhase(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        1,
      ),
    ).toBe(GamePhase.Opening)
  })

  it('classifies early game (move 8) as opening', () => {
    expect(
      determinePhase(
        'r1bqkb1r/pppppppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        8,
      ),
    ).toBe(GamePhase.Opening)
  })

  it('classifies move 20 with many pieces as middlegame', () => {
    expect(
      determinePhase(
        'r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 0 10',
        20,
      ),
    ).toBe(GamePhase.Middlegame)
  })

  it('classifies position with few pieces as endgame', () => {
    expect(
      determinePhase('8/5pk1/8/8/8/8/5PK1/4R3 w - - 0 40', 80),
    ).toBe(GamePhase.Endgame)
  })

  it('classifies king + pawns only as endgame', () => {
    expect(
      determinePhase('8/5pk1/6p1/8/8/6P1/5PK1/8 w - - 0 45', 90),
    ).toBe(GamePhase.Endgame)
  })

  it('classifies queen + minor piece positions after move 15 as middlegame', () => {
    expect(
      determinePhase(
        'r2q1rk1/ppp2ppp/2n2n2/3p4/3P4/2N2N2/PPP2PPP/R2Q1RK1 w - - 0 12',
        24,
      ),
    ).toBe(GamePhase.Middlegame)
  })
})
