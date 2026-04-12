import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ingestGames } from '../ingest'
import type { NormalizedGame } from '../chesscom'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../chesscom', () => ({
  fetchChesscomGames: vi.fn(),
}))

vi.mock('../lichess', () => ({
  fetchLichessGames: vi.fn(),
}))

const mockInsert = vi.fn(() => ({ data: null, error: null }))
const mockIn = vi.fn(() => ({ data: [], error: null }))
const mockFrom = vi.fn((table: string) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      in: mockIn,
    })),
  })),
  insert: mockInsert,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

import { fetchChesscomGames } from '../chesscom'
import { fetchLichessGames } from '../lichess'

const MOCK_GAME: NormalizedGame = {
  pgn: '1. e4 e5 1-0',
  source: 'chesscom',
  sourceGameId: '123',
  result: '1-0',
  userColor: 'white',
  timeControl: '300',
  openingEco: 'B20',
  playedAt: '2026-03-15T00:00:00.000Z',
}

const MOCK_LICHESS_GAME: NormalizedGame = {
  ...MOCK_GAME,
  source: 'lichess',
  sourceGameId: 'abc123',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ingestGames', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Chess.com client when source is chesscom', async () => {
    vi.mocked(fetchChesscomGames).mockResolvedValueOnce([MOCK_GAME])

    const result = await ingestGames('testuser', 'chesscom', 10)

    expect(fetchChesscomGames).toHaveBeenCalledWith('testuser', 10)
    expect(fetchLichessGames).not.toHaveBeenCalled()
    expect(result.total).toBe(1)
  })

  it('calls Lichess client when source is lichess', async () => {
    vi.mocked(fetchLichessGames).mockResolvedValueOnce([MOCK_LICHESS_GAME])

    const result = await ingestGames('testuser', 'lichess', 10)

    expect(fetchLichessGames).toHaveBeenCalledWith('testuser', 10)
    expect(fetchChesscomGames).not.toHaveBeenCalled()
    expect(result.total).toBe(1)
  })

  it('returns imported count and total', async () => {
    vi.mocked(fetchChesscomGames).mockResolvedValueOnce([
      MOCK_GAME,
      { ...MOCK_GAME, sourceGameId: '456' },
    ])

    const result = await ingestGames('testuser', 'chesscom', 10)

    expect(result).toEqual({ imported: 2, total: 2 })
  })

  it('returns zero counts when no games found', async () => {
    vi.mocked(fetchChesscomGames).mockResolvedValueOnce([])

    const result = await ingestGames('testuser', 'chesscom', 10)

    expect(result).toEqual({ imported: 0, total: 0 })
  })
})
