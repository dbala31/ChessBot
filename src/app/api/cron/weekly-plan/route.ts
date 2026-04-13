import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { computeAllSkills } from '@/lib/analysis/computeSkills'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: users, error } = await supabase.from('user_settings').select('user_id')

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const results: Array<{
    userId: string
    scoresComputed: boolean
    error?: string
  }> = []

  for (const user of users ?? []) {
    try {
      await computeAllSkills(user.user_id)
      results.push({ userId: user.user_id, scoresComputed: true })
    } catch (err: unknown) {
      results.push({
        userId: user.user_id,
        scoresComputed: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ success: true, data: results })
}
