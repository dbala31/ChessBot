import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function POST() {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  // Delete in order to respect foreign key constraints
  // 1. drill_attempts (references puzzles)
  await supabase.from('drill_attempts').delete().eq('user_id', userId)

  // 2. study_plans
  await supabase.from('study_plans').delete().eq('user_id', userId)

  // 3. skill_scores
  await supabase.from('skill_scores').delete().eq('user_id', userId)

  // 4. puzzles from user's games (references games via source_game_id)
  const { data: gameIds } = await supabase
    .from('games')
    .select('id')
    .eq('user_id', userId)

  if (gameIds && gameIds.length > 0) {
    const ids = gameIds.map((g: { id: string }) => g.id)

    // 5. analyzed_moves (references games)
    await supabase.from('analyzed_moves').delete().in('game_id', ids)

    // 6. puzzles from own games
    await supabase.from('puzzles').delete().in('source_game_id', ids)
  }

  // 7. games
  await supabase.from('games').delete().eq('user_id', userId)

  // 8. user_settings
  await supabase.from('user_settings').delete().eq('user_id', userId)

  return NextResponse.json({
    success: true,
    message: 'All user data deleted. You can re-import from Settings.',
  })
}
