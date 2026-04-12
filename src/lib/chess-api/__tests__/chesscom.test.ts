import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchChesscomGames } from '../chesscom'
import type { Game } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.03.15"]
[White "testuser"]
[Black "opponent1"]
[Result "1-0"]
[WhiteElo "1500"]
[BlackElo "1400"]
[TimeControl "300"]
[ECO "B20"]
[Termination "testuser won by checkmate"]

1. e4 c5 2. d4 1-0`

const SAMPLE_GAME = {
  url: 'https://www.chess.com/game/live/123456',
  pgn: SAMPLE_PGN,
  time_control: '300',
  time_class: 'blitz',
  end_time: 1741123456,
  rated: true,
  rules: 'chess',
  white: {
    rating: 1500,
    result: 'win',
    '@id': 'https://api.chess.com/pub/player/testuser',
    username: 'testuser',
  },
  black: {
    rating: 1400,
    result: 'checkmated',
    '@id': 'https://api.chess.com/pub/player/opponent1',
    username: 'opponent1',
  },
  eco: 'https://www.chess.com/openings/Sicilian-Defense',
}

const SAMPLE_GAME_BLACK = {
  ...SAMPLE_GAME,
  url: 'https://www.chess.com/game/live/789012',
  white: {
    ...SAMPLE_GAME.black,
    result: 'win',
    username: 'opponent2',
  },
  black: {
    ...SAMPLE_GAME.white,
    result: 'checkmated',
    username: 'testuser',
  },
  pgn: SAMPLE_PGN.replace('[Result "1-0"]', '[Result "0-1"]').replace(
    '1-0',
    '0-1',
  ),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchChesscomGames', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches archives newest-first and returns normalized Game objects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    // Archives response
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/02',
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )

    // Newest month first (March)
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ games: [SAMPLE_GAME] })),
    )

    const games = await fetchChesscomGames('testuser', 1)

    expect(games).toHaveLength(1)
    expect(games[0]).toMatchObject({
      pgn: SAMPLE_PGN,
      source: 'chesscom',
      sourceGameId: '123456',
      result: '1-0',
      userColor: 'white',
      timeControl: '300',
      openingEco: 'B20',
    })
    expect(games[0].playedAt).toBeDefined()
  })

  it('determines userColor correctly when playing black', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ games: [SAMPLE_GAME_BLACK] })),
    )

    const games = await fetchChesscomGames('testuser', 1)
    expect(games[0].userColor).toBe('black')
  })

  it('fetches multiple archives until limit is reached', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/01',
            'https://api.chess.com/pub/player/testuser/games/2026/02',
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )

    // March (newest) — has 1 game
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ games: [SAMPLE_GAME] })),
    )

    // February — has 1 game, but limit=1 already met
    const games = await fetchChesscomGames('testuser', 1)

    expect(games).toHaveLength(1)
    // Should only call: archives + 1 month (March)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('skips games with empty PGN', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          games: [{ ...SAMPLE_GAME, pgn: '' }, SAMPLE_GAME],
        }),
      ),
    )

    const games = await fetchChesscomGames('testuser', 10)
    expect(games).toHaveLength(1)
  })

  it('filters out non-standard chess variants', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          games: [
            { ...SAMPLE_GAME, rules: 'chess960' },
            { ...SAMPLE_GAME, rules: 'bughouse' },
            SAMPLE_GAME,
          ],
        }),
      ),
    )

    const games = await fetchChesscomGames('testuser', 10)
    expect(games).toHaveLength(1)
    expect(games[0].source).toBe('chesscom')
  })

  it('throws on 404 (user not found)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 404 }))

    await expect(fetchChesscomGames('nonexistent', 10)).rejects.toThrow(
      /not found/i,
    )
  })

  it('throws on 429 (rate limited)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(
      new Response(null, {
        status: 429,
        headers: { 'Retry-After': '30' },
      }),
    )

    await expect(fetchChesscomGames('testuser', 10)).rejects.toThrow(
      /rate limit/i,
    )
  })

  it('extracts ECO from PGN headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          archives: [
            'https://api.chess.com/pub/player/testuser/games/2026/03',
          ],
        }),
      ),
    )
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ games: [SAMPLE_GAME] })),
    )

    const games = await fetchChesscomGames('testuser', 1)
    expect(games[0].openingEco).toBe('B20')
  })

  it('returns empty array when player has no games', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ archives: [] })),
    )

    const games = await fetchChesscomGames('testuser', 10)
    expect(games).toEqual([])
  })
})
