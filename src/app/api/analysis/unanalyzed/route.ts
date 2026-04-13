import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/user'

export async function GET() {
  const userId = getUserId()
  const supabase = createServiceClient()

  const { data: games, error } = await supabase
    .from('games')
    .select('id, pgn')
    .eq('user_id', userId)
    .eq('analysis_complete', false)
    .order('played_at', { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: games ?? [],
  })
}
