import type { GameSource } from '@/types'
import { fetchChesscomGames } from './chesscom'
import type { NormalizedGame } from './chesscom'
import { fetchLichessGames } from './lichess'
import { createServiceClient } from '@/lib/supabase/server'

export interface IngestResult {
  readonly imported: number
  readonly total: number
}

export async function ingestGames(
  username: string,
  source: GameSource,
  limit: number,
): Promise<IngestResult> {
  const games: readonly NormalizedGame[] =
    source === 'chesscom'
      ? await fetchChesscomGames(username, limit)
      : await fetchLichessGames(username, limit)

  if (games.length === 0) {
    return { imported: 0, total: 0 }
  }

  const supabase = createServiceClient()

  // Fetch existing source_game_ids to deduplicate
  const sourceGameIds = games.map((g) => g.sourceGameId)
  const { data: existing } = await supabase
    .from('games')
    .select('source_game_id')
    .eq('source', source)
    .in('source_game_id', sourceGameIds)

  const existingIds = new Set(
    (existing ?? []).map(
      (row: { source_game_id: string }) => row.source_game_id,
    ),
  )

  const newGames = games.filter((g) => !existingIds.has(g.sourceGameId))

  if (newGames.length === 0) {
    return { imported: 0, total: games.length }
  }

  const rows = newGames.map((game) => ({
    pgn: game.pgn,
    source: game.source,
    source_game_id: game.sourceGameId,
    result: game.result,
    user_color: game.userColor,
    time_control: game.timeControl,
    opening_eco: game.openingEco,
    played_at: game.playedAt,
    analysis_complete: false,
  }))

  const { error } = await supabase.from('games').insert(rows)

  if (error) {
    throw new Error(`Failed to insert games: ${error.message}`)
  }

  return { imported: newGames.length, total: games.length }
}
