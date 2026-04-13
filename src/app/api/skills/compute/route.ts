import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeAllSkills } from '@/lib/analysis/computeSkills'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  let userId: string

  try {
    const body = (await request.json()) as { userId?: unknown }
    userId =
      typeof body.userId === 'string' && body.userId.trim().length > 0
        ? body.userId
        : await getUserIdFromSession()
  } catch {
    userId = await getUserIdFromSession()
  }

  try {
    const scores = await computeAllSkills(userId)
    return NextResponse.json({ success: true, data: scores })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Computation failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId') ?? (await getUserIdFromSession())

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('skill_scores')
    .select('score_type, value, computed_at')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
