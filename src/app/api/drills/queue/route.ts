import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildDrillQueue } from '@/lib/drills/queue'
import type { LessonType, ScoreType } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId query parameter is required' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()

  // Get skill scores
  const { data: scores } = await supabase
    .from('skill_scores')
    .select('score_type, value')
    .eq('user_id', userId)

  // Get available puzzles
  const { data: puzzles } = await supabase.from('puzzles').select('id, lesson_type, difficulty')

  // Get recently attempted puzzle IDs (last 3 days)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentAttempts } = await supabase
    .from('drill_attempts')
    .select('puzzle_id')
    .eq('user_id', userId)
    .gte('attempted_at', threeDaysAgo)

  const mappedScores = (scores ?? []).map((s: { score_type: string; value: number }) => ({
    scoreType: s.score_type as ScoreType,
    value: s.value,
  }))

  const mappedPuzzles = (puzzles ?? []).map(
    (p: { id: string; lesson_type: string; difficulty: number }) => ({
      id: p.id,
      lessonType: p.lesson_type as LessonType,
      difficulty: p.difficulty,
    }),
  )

  const recentIds = (recentAttempts ?? []).map((a: { puzzle_id: string }) => a.puzzle_id)

  const queue = buildDrillQueue(mappedPuzzles, mappedScores, recentIds, 15)

  return NextResponse.json({ success: true, data: queue })
}
