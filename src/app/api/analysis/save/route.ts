import { NextResponse } from 'next/server'
import { saveAnalysis } from '@/lib/analysis/persist'
import { generateDrillsFromMoves } from '@/lib/drills/generate'
import { createServiceClient } from '@/lib/supabase/server'
import { MoveClassification, GamePhase } from '@/types'

interface MoveData {
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

export async function POST(request: Request) {
  const body = await request.json()
  const { gameId, moves } = body as { gameId: string; moves: MoveData[] }

  if (!gameId || !Array.isArray(moves)) {
    return NextResponse.json(
      { success: false, error: 'gameId and moves array required' },
      { status: 400 },
    )
  }

  try {
    // Save analyzed moves to DB
    await saveAnalysis(gameId, moves)

    // Generate drills from mistakes/blunders and save them
    const drills = generateDrillsFromMoves(
      moves.map((m) => ({
        ply: m.ply,
        fenBefore: m.fenBefore,
        playedMove: m.playedMove,
        bestMove: m.bestMove,
        cpLoss: m.cpLoss,
        classification: m.classification as MoveClassification,
        phase: m.phase as GamePhase,
        evalBefore: m.evalBefore,
      })),
      gameId,
    )

    if (drills.length > 0) {
      const supabase = createServiceClient()
      const rows = drills.map((d) => ({
        fen: d.fen,
        solution_pv: d.solutionPv,
        source: d.source,
        source_game_id: gameId,
        difficulty: d.difficulty,
        lesson_type: d.lessonType,
        theme_tags: [...d.themeTags],
      }))

      await supabase.from('puzzles').insert(rows)
    }

    return NextResponse.json({
      success: true,
      data: { movesStored: moves.length, drillsGenerated: drills.length },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save analysis'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
