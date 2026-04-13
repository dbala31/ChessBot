import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('chesscom_username, lichess_username, onboarding_complete')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: data ?? { chesscom_username: null, lichess_username: null, onboarding_complete: false },
  })
}

export async function POST(request: Request) {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  const body = await request.json()
  const { chesscomUsername, lichessUsername } = body as {
    chesscomUsername?: string
    lichessUsername?: string
  }

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      chesscom_username: chesscomUsername ?? null,
      lichess_username: lichessUsername ?? null,
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
