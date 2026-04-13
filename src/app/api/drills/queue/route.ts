import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { buildDrillQueue } from '@/lib/drills/queue'
import { getUserId } from '@/lib/auth/user'
import type { LessonType, ScoreType } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') ?? getUserId()

  const supabase = createServiceClient()

  // Get skill scores
  const { data: scores } = await supabase
    .from('skill_scores')
    .select('score_type, value')
    .eq('user_id', userId)

  // Get available puzzles (full data for training page)
  const { data: puzzles } = await supabase
    .from('puzzles')
    .select('id, fen, solution_pv, lesson_type, difficulty, theme_tags, source')

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
    (p: { id: string; fen: string; solution_pv: string; lesson_type: string; difficulty: number; theme_tags: string[]; source: string }) => ({
      id: p.id,
      fen: p.fen,
      solutionPv: p.solution_pv,
      lessonType: p.lesson_type as LessonType,
      difficulty: p.difficulty,
      themeTags: p.theme_tags,
      source: p.source,
    }),
  )

  const recentIds = (recentAttempts ?? []).map((a: { puzzle_id: string }) => a.puzzle_id)

  const queue = buildDrillQueue(mappedPuzzles, mappedScores, recentIds, 15)

  return NextResponse.json({ success: true, data: queue })
}
