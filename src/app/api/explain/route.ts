import { NextRequest, NextResponse } from 'next/server'
import { explainMove } from '@/lib/claude/client'
import { GamePhase } from '@/types'

const VALID_PHASES = new Set(Object.values(GamePhase))

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { fen, playedMove, bestMove, cpLoss, phase } = body

  if (!fen || !playedMove || !bestMove || typeof cpLoss !== 'number' || !VALID_PHASES.has(phase)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const explanation = await explainMove({ fen, playedMove, bestMove, cpLoss, phase })
    return NextResponse.json({ explanation })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate explanation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
