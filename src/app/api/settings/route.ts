import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select(
      'chesscom_username, lichess_username, onboarding_complete, current_rating, target_rating',
    )
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: data ?? {
      chesscom_username: null,
      lichess_username: null,
      onboarding_complete: false,
      current_rating: null,
      target_rating: null,
    },
  })
}

export async function POST(request: Request) {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  const body = await request.json()
  const { chesscomUsername, lichessUsername, currentRating, targetRating } = body as {
    chesscomUsername?: string
    lichessUsername?: string
    currentRating?: number
    targetRating?: number
  }

  const upsertData: Record<string, unknown> = {
    user_id: userId,
    chesscom_username: chesscomUsername ?? null,
    lichess_username: lichessUsername ?? null,
  }

  if (currentRating !== undefined) upsertData.current_rating = currentRating
  if (targetRating !== undefined) upsertData.target_rating = targetRating

  const { error } = await supabase
    .from('user_settings')
    .upsert(upsertData, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
