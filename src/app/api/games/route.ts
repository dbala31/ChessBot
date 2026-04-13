import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/user'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')
  const result = searchParams.get('result')
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '25')))
  const offset = (page - 1) * limit

  const userId = getUserId()
  const supabase = createServiceClient()

  let query = supabase
    .from('games')
    .select('id, source, source_game_id, result, user_color, time_control, opening_eco, played_at, analysis_complete, pgn', { count: 'exact' })
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (source && (source === 'chesscom' || source === 'lichess')) {
    query = query.eq('source', source)
  }
  if (result && ['1-0', '0-1', '1/2-1/2'].includes(result)) {
    query = query.eq('result', result)
  }

  const { data: games, error, count } = await query

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  // For analyzed games, fetch accuracy stats from analyzed_moves
  const analyzedGameIds = (games ?? [])
    .filter((g: { analysis_complete: boolean }) => g.analysis_complete)
    .map((g: { id: string }) => g.id)

  let accuracyMap: Record<string, { accuracy: number; blunders: number }> = {}

  if (analyzedGameIds.length > 0) {
    const { data: stats } = await supabase
      .from('analyzed_moves')
      .select('game_id, cp_loss, classification')
      .in('game_id', analyzedGameIds)

    if (stats) {
      const grouped: Record<string, { totalCpLoss: number; moveCount: number; blunders: number }> = {}
      for (const row of stats as Array<{ game_id: string; cp_loss: number; classification: string }>) {
        if (!grouped[row.game_id]) {
          grouped[row.game_id] = { totalCpLoss: 0, moveCount: 0, blunders: 0 }
        }
        grouped[row.game_id].totalCpLoss += row.cp_loss
        grouped[row.game_id].moveCount += 1
        if (row.classification === 'blunder') {
          grouped[row.game_id].blunders += 1
        }
      }

      for (const [gameId, data] of Object.entries(grouped)) {
        const avgCpLoss = data.moveCount > 0 ? data.totalCpLoss / data.moveCount : 0
        // Convert avg cp_loss to accuracy percentage (0 cp_loss = 100%, 100+ cp_loss = ~50%)
        const accuracy = Math.round(Math.max(0, Math.min(100, 100 - avgCpLoss * 0.5)))
        accuracyMap[gameId] = { accuracy, blunders: data.blunders }
      }
    }
  }

  // Extract opponent name from PGN headers
  function extractOpponent(pgn: string, userColor: string): string {
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/)
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/)
    if (userColor === 'white') {
      return blackMatch?.[1] ?? 'Unknown'
    }
    return whiteMatch?.[1] ?? 'Unknown'
  }

  const enrichedGames = (games ?? []).map((g: {
    id: string
    source: string
    result: string
    user_color: string
    time_control: string
    opening_eco: string | null
    played_at: string
    analysis_complete: boolean
    pgn: string
  }) => ({
    id: g.id,
    opponent: extractOpponent(g.pgn, g.user_color),
    result: g.result,
    userColor: g.user_color,
    timeControl: g.time_control,
    source: g.source,
    playedAt: g.played_at,
    openingEco: g.opening_eco ?? '',
    analysisComplete: g.analysis_complete,
    accuracy: accuracyMap[g.id]?.accuracy ?? null,
    blunders: accuracyMap[g.id]?.blunders ?? null,
  }))

  return NextResponse.json({
    success: true,
    data: enrichedGames,
    meta: { total: count ?? 0, page, limit },
  })
}
