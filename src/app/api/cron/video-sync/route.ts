import { NextResponse } from 'next/server'
import { fetchGothamChessVideos } from '@/lib/videos/youtube'

export async function GET(request: Request) {
  // Verify cron secret for Vercel cron jobs
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await fetchGothamChessVideos(50)
    return NextResponse.json({ success: true, data: { videosProcessed: count } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Video sync failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
