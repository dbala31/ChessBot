import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeAllSkills } from '@/lib/analysis/computeSkills'

export async function POST(request: Request) {
  let body: { userId: unknown }
  try {
    body = (await request.json()) as { userId: unknown }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  if (typeof body.userId !== 'string' || body.userId.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 },
    )
  }

  try {
    const scores = await computeAllSkills(body.userId)
    return NextResponse.json({ success: true, data: scores })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Computation failed'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    )
  }
}

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

  const { data, error } = await supabase
    .from('skill_scores')
    .select('score_type, value, computed_at')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data })
}
