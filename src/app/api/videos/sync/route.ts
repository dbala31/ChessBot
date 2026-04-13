import { NextResponse } from 'next/server'
import { fetchGothamChessVideos } from '@/lib/videos/youtube'

export async function POST() {
  try {
    const count = await fetchGothamChessVideos(50)
    return NextResponse.json({ success: true, data: { videosProcessed: count } })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Video sync failed'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
