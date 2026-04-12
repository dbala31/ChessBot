import type { GameSource } from '@/types'

const BASE_URL = 'https://api.chess.com/pub'
const USER_AGENT = 'ChessBot/1.0 (https://github.com/dbala31/ChessBot)'
const DELAY_MS = 500

interface ChesscomPlayer {
  readonly rating: number
  readonly result: string
  readonly '@id': string
  readonly username: string
}

interface ChesscomGame {
  readonly url: string
  readonly pgn: string
  readonly time_control: string
  readonly time_class: string
  readonly end_time: number
  readonly rated: boolean
  readonly rules: string
  readonly white: ChesscomPlayer
  readonly black: ChesscomPlayer
  readonly eco?: string
}

interface ArchivesResponse {
  readonly archives: readonly string[]
}

interface GamesResponse {
  readonly games: readonly ChesscomGame[]
}

export interface NormalizedGame {
  readonly pgn: string
  readonly source: GameSource
  readonly sourceGameId: string
  readonly result: string
  readonly userColor: 'white' | 'black'
  readonly timeControl: string
  readonly openingEco: string | null
  readonly playedAt: string
}

function extractGameId(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1]
}

function extractEcoFromPgn(pgn: string): string | null {
  const match = pgn.match(/\[ECO "([^"]+)"\]/)
  return match ? match[1] : null
}

function extractResultFromPgn(pgn: string): string {
  const match = pgn.match(/\[Result "([^"]+)"\]/)
  return match ? match[1] : '*'
}

async function fetchWithHeaders(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (response.status === 404) {
    throw new Error('Player not found on Chess.com')
  }
  if (response.status === 429) {
    throw new Error('Chess.com rate limit exceeded. Try again later.')
  }
  if (!response.ok) {
    throw new Error(`Chess.com API error: ${response.status}`)
  }

  return response
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchChesscomGames(
  username: string,
  limit: number,
): Promise<readonly NormalizedGame[]> {
  const normalizedUsername = username.toLowerCase()

  const archivesRes = await fetchWithHeaders(
    `${BASE_URL}/player/${normalizedUsername}/games/archives`,
  )
  const { archives } = (await archivesRes.json()) as ArchivesResponse

  if (archives.length === 0) {
    return []
  }

  const games: NormalizedGame[] = []

  // Iterate newest-first
  for (let i = archives.length - 1; i >= 0 && games.length < limit; i--) {
    if (i < archives.length - 1) {
      await delay(DELAY_MS)
    }

    const monthRes = await fetchWithHeaders(archives[i])
    const { games: monthGames } = (await monthRes.json()) as GamesResponse

    // Process games newest-first within each month
    for (let j = monthGames.length - 1; j >= 0 && games.length < limit; j--) {
      const game = monthGames[j]

      // Skip non-standard variants and empty PGNs
      if (game.rules !== 'chess') continue
      if (!game.pgn || game.pgn.length === 0) continue

      const isWhite =
        game.white.username.toLowerCase() === normalizedUsername

      games.push({
        pgn: game.pgn,
        source: 'chesscom',
        sourceGameId: extractGameId(game.url),
        result: extractResultFromPgn(game.pgn),
        userColor: isWhite ? 'white' : 'black',
        timeControl: game.time_control,
        openingEco: extractEcoFromPgn(game.pgn),
        playedAt: new Date(game.end_time * 1000).toISOString(),
      })
    }
  }

  return games
}
