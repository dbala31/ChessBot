import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchLichessGames } from '../lichess'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SAMPLE_PGN = `[Event "Rated Blitz game"]
[Site "https://lichess.org/abc12345"]
[Date "2026.03.15"]
[White "testuser"]
[Black "opponent1"]
[Result "1-0"]
[WhiteElo "1600"]
[BlackElo "1550"]
[TimeControl "300+0"]
[ECO "C50"]

1. e4 e5 2. Nf3 1-0`

const SAMPLE_GAME = {
  id: 'abc12345',
  rated: true,
  variant: 'standard',
  speed: 'blitz',
  perf: 'blitz',
  createdAt: 1741123200000,
  lastMoveAt: 1741123800000,
  status: 'mate',
  players: {
    white: {
      user: { name: 'testuser', id: 'testuser' },
      rating: 1600,
      ratingDiff: 8,
    },
    black: {
      user: { name: 'opponent1', id: 'opponent1' },
      rating: 1550,
      ratingDiff: -8,
    },
  },
  winner: 'white',
  opening: { eco: 'C50', name: 'Italian Game', ply: 4 },
  moves: 'e4 e5 Nf3',
  pgn: SAMPLE_PGN,
  clock: { initial: 300, increment: 0, totalTime: 300 },
}

const SAMPLE_GAME_2 = {
  ...SAMPLE_GAME,
  id: 'def67890',
  createdAt: 1741110000000,
  winner: 'black',
  players: {
    white: {
      user: { name: 'opponent2', id: 'opponent2' },
      rating: 1500,
      ratingDiff: -8,
    },
    black: {
      user: { name: 'testuser', id: 'testuser' },
      rating: 1600,
      ratingDiff: 8,
    },
  },
}

function makeNdjsonResponse(games: readonly unknown[]): Response {
  const body = games.map((g) => JSON.stringify(g)).join('\n') + '\n'
  return new Response(body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fetchLichessGames', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches games and returns normalized Game objects', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([SAMPLE_GAME]))

    const games = await fetchLichessGames('testuser', 10)

    expect(games).toHaveLength(1)
    expect(games[0]).toMatchObject({
      pgn: SAMPLE_PGN,
      source: 'lichess',
      sourceGameId: 'abc12345',
      result: '1-0',
      userColor: 'white',
      timeControl: '300+0',
      openingEco: 'C50',
    })
  })

  it('determines userColor correctly when playing black', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([SAMPLE_GAME_2]))

    const games = await fetchLichessGames('testuser', 10)
    expect(games[0].userColor).toBe('black')
  })

  it('determines result correctly for draws', async () => {
    const drawGame = {
      ...SAMPLE_GAME,
      status: 'draw',
      winner: undefined,
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([drawGame]))

    const games = await fetchLichessGames('testuser', 10)
    expect(games[0].result).toBe('1/2-1/2')
  })

  it('sends correct headers and query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([]))

    await fetchLichessGames('testuser', 50)

    const [url, options] = fetchSpy.mock.calls[0]
    const urlStr = url as string
    expect(urlStr).toContain('/api/games/user/testuser')
    expect(urlStr).toContain('max=50')
    expect(urlStr).toContain('pgnInJson=true')
    expect(urlStr).toContain('opening=true')
    expect(urlStr).toContain('clocks=true')
    expect((options as RequestInit).headers).toHaveProperty('Accept', 'application/x-ndjson')
  })

  it('filters out non-standard variants', async () => {
    const chess960 = { ...SAMPLE_GAME, id: 'x960', variant: 'chess960' }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([chess960, SAMPLE_GAME]))

    const games = await fetchLichessGames('testuser', 10)
    expect(games).toHaveLength(1)
    expect(games[0].sourceGameId).toBe('abc12345')
  })

  it('throws on 404 (user not found)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 404 }))

    await expect(fetchLichessGames('nonexistent', 10)).rejects.toThrow(/not found/i)
  })

  it('throws on 429 (rate limited)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(new Response(null, { status: 429 }))

    await expect(fetchLichessGames('testuser', 10)).rejects.toThrow(/rate limit/i)
  })

  it('returns empty array when no games', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([]))

    const games = await fetchLichessGames('testuser', 10)
    expect(games).toEqual([])
  })

  it('formats timeControl with increment', async () => {
    const gameWithIncrement = {
      ...SAMPLE_GAME,
      clock: { initial: 600, increment: 5, totalTime: 600 },
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    fetchSpy.mockResolvedValueOnce(makeNdjsonResponse([gameWithIncrement]))

    const games = await fetchLichessGames('testuser', 10)
    expect(games[0].timeControl).toBe('600+5')
  })
})
