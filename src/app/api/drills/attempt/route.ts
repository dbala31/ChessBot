import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

interface AttemptBody {
  readonly userId: unknown
  readonly puzzleId: unknown
  readonly correct: unknown
  readonly timeTakenMs: unknown
}

export async function POST(request: Request) {
  let body: AttemptBody
  try {
    body = (await request.json()) as AttemptBody
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, puzzleId, correct, timeTakenMs } = body

  if (typeof userId !== 'string' || typeof puzzleId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'userId and puzzleId are required strings' },
      { status: 400 },
    )
  }

  if (typeof correct !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'correct must be a boolean' },
      { status: 400 },
    )
  }

  if (typeof timeTakenMs !== 'number' || timeTakenMs < 0) {
    return NextResponse.json(
      { success: false, error: 'timeTakenMs must be a positive number' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  const { error } = await supabase.from('drill_attempts').insert({
    user_id: userId,
    puzzle_id: puzzleId,
    correct,
    time_taken_ms: timeTakenMs,
    attempted_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
