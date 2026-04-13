import type { GameSource } from '@/types'
import type { NormalizedGame } from './chesscom'

const BASE_URL = 'https://lichess.org'

interface LichessPlayer {
  readonly user: {
    readonly name: string
    readonly id: string
  }
  readonly rating: number
  readonly ratingDiff?: number
}

interface LichessGame {
  readonly id: string
  readonly rated: boolean
  readonly variant: string
  readonly speed: string
  readonly createdAt: number
  readonly lastMoveAt: number
  readonly status: string
  readonly players: {
    readonly white: LichessPlayer
    readonly black: LichessPlayer
  }
  readonly winner?: string
  readonly opening?: {
    readonly eco: string
    readonly name: string
    readonly ply: number
  }
  readonly moves: string
  readonly pgn?: string
  readonly clock?: {
    readonly initial: number
    readonly increment: number
    readonly totalTime: number
  }
}

function determineResult(game: LichessGame): string {
  if (!game.winner) {
    return '1/2-1/2'
  }
  return game.winner === 'white' ? '1-0' : '0-1'
}

function formatTimeControl(clock?: LichessGame['clock']): string {
  if (!clock) return 'unknown'
  return `${clock.initial}+${clock.increment}`
}

async function fetchWithHeaders(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/x-ndjson',
    },
  })

  if (response.status === 404) {
    throw new Error('Player not found on Lichess')
  }
  if (response.status === 429) {
    throw new Error('Lichess rate limit exceeded. Try again later.')
  }
  if (!response.ok) {
    throw new Error(`Lichess API error: ${response.status}`)
  }

  return response
}

function parseNdjson(text: string): readonly LichessGame[] {
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as LichessGame)
}

export async function fetchLichessGames(
  username: string,
  limit: number,
): Promise<readonly NormalizedGame[]> {
  const normalizedUsername = username.toLowerCase()

  const params = new URLSearchParams({
    max: String(limit),
    pgnInJson: 'true',
    opening: 'true',
    clocks: 'true',
    sort: 'dateDesc',
  })

  const response = await fetchWithHeaders(
    `${BASE_URL}/api/games/user/${normalizedUsername}?${params}`,
  )

  const text = await response.text()
  if (!text.trim()) {
    return []
  }

  const rawGames = parseNdjson(text)

  return rawGames
    .filter((game) => game.variant === 'standard')
    .map((game): NormalizedGame => {
      const isWhite = game.players.white.user.id.toLowerCase() === normalizedUsername

      return {
        pgn: game.pgn ?? '',
        source: 'lichess' as GameSource,
        sourceGameId: game.id,
        result: determineResult(game),
        userColor: isWhite ? 'white' : 'black',
        timeControl: formatTimeControl(game.clock),
        openingEco: game.opening?.eco ?? null,
        playedAt: new Date(game.createdAt).toISOString(),
      }
    })
}
