import { createServiceClient } from '@/lib/supabase/server'

interface AnalyzedMoveRow {
  readonly ply: number
  readonly fenBefore: string
  readonly playedMove: string
  readonly bestMove: string
  readonly evalBefore: number
  readonly evalAfter: number
  readonly cpLoss: number
  readonly classification: string
  readonly phase: string
}

export async function saveAnalysis(
  gameId: string,
  moves: readonly AnalyzedMoveRow[],
): Promise<void> {
  const supabase = createServiceClient()

  // Delete existing analysis for idempotency
  const { error: deleteError } = await supabase
    .from('analyzed_moves')
    .delete()
    .eq('game_id', gameId)

  if (deleteError) {
    throw new Error(
      `Failed to clear existing analysis: ${deleteError.message}`,
    )
  }

  // Insert new analysis
  const rows = moves.map((move) => ({
    game_id: gameId,
    ply: move.ply,
    fen_before: move.fenBefore,
    played_move: move.playedMove,
    best_move: move.bestMove,
    eval_before: move.evalBefore,
    eval_after: move.evalAfter,
    cp_loss: move.cpLoss,
    classification: move.classification,
    phase: move.phase,
  }))

  const { error: insertError } = await supabase
    .from('analyzed_moves')
    .insert(rows)

  if (insertError) {
    throw new Error(`Failed to save analysis: ${insertError.message}`)
  }

  // Mark game as analysis complete
  const { error: updateError } = await supabase
    .from('games')
    .update({ analysis_complete: true })
    .eq('id', gameId)

  if (updateError) {
    throw new Error(
      `Failed to mark game as analyzed: ${updateError.message}`,
    )
  }
}
