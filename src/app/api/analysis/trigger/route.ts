import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface TriggerRequestBody {
  readonly gameIds: unknown
}

export async function POST(request: Request) {
  let body: TriggerRequestBody
  try {
    body = (await request.json()) as TriggerRequestBody
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { gameIds } = body

  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'gameIds must be a non-empty array' },
      { status: 400 },
    )
  }

  if (gameIds.length > 50) {
    return NextResponse.json(
      { success: false, error: 'Maximum 50 games per request' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  const { data: games, error } = await supabase
    .from('games')
    .select('id, pgn, analysis_complete')
    .in('id', gameIds)

  if (error) {
    return NextResponse.json(
      { success: false, error: `Database error: ${error.message}` },
      { status: 500 },
    )
  }

  // Return PGNs for client-side analysis (actual analysis happens in Web Worker)
  const gamesToAnalyze = (games ?? [])
    .filter((g: { analysis_complete: boolean }) => !g.analysis_complete)
    .map((g: { id: string; pgn: string }) => ({
      id: g.id,
      pgn: g.pgn,
    }))

  return NextResponse.json({
    success: true,
    data: {
      games: gamesToAnalyze,
      alreadyAnalyzed: (games ?? []).length - gamesToAnalyze.length,
    },
  })
}
