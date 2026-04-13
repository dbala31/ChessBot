import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'
import { getRecommendedVideos } from '@/lib/videos/youtube'

export async function GET() {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  // Get user's skill scores for personalization
  const { data: scores } = await supabase
    .from('skill_scores')
    .select('score_type, value')
    .eq('user_id', userId)

  const mappedScores = (scores ?? []).map((s: { score_type: string; value: number }) => ({
    scoreType: s.score_type,
    value: s.value,
  }))

  const recommendations = await getRecommendedVideos(mappedScores)

  return NextResponse.json({ success: true, data: recommendations })
}
