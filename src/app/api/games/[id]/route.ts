import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  // Fetch the game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(
      'id, pgn, source, result, user_color, time_control, opening_eco, played_at, analysis_complete',
    )
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
  }

  // Fetch analyzed moves if analysis is complete
  let analyzedMoves: Array<{
    ply: number
    fen_before: string
    played_move: string
    best_move: string
    eval_before: number
    eval_after: number
    cp_loss: number
    classification: string
    phase: string
  }> = []

  if (game.analysis_complete) {
    const { data: moves } = await supabase
      .from('analyzed_moves')
      .select(
        'ply, fen_before, played_move, best_move, eval_before, eval_after, cp_loss, classification, phase',
      )
      .eq('game_id', id)
      .order('ply', { ascending: true })

    analyzedMoves = (moves ?? []) as typeof analyzedMoves
  }

  // Extract opponent from PGN headers
  const whiteMatch = game.pgn.match(/\[White "([^"]+)"\]/)
  const blackMatch = game.pgn.match(/\[Black "([^"]+)"\]/)
  const opponent =
    game.user_color === 'white' ? (blackMatch?.[1] ?? 'Unknown') : (whiteMatch?.[1] ?? 'Unknown')

  return NextResponse.json({
    success: true,
    data: {
      id: game.id,
      pgn: game.pgn,
      source: game.source,
      result: game.result,
      userColor: game.user_color,
      timeControl: game.time_control,
      openingEco: game.opening_eco,
      playedAt: game.played_at,
      analysisComplete: game.analysis_complete,
      opponent,
      moves: analyzedMoves.map((m) => ({
        ply: m.ply,
        fenBefore: m.fen_before,
        playedMove: m.played_move,
        bestMove: m.best_move,
        evalBefore: m.eval_before,
        evalAfter: m.eval_after,
        cpLoss: m.cp_loss,
        classification: m.classification,
        phase: m.phase,
      })),
    },
  })
}
