import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { ingestGames } from '@/lib/chess-api/ingest'
import type { GameSource } from '@/types'

const SYNC_LIMIT = 50

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: users, error } = await supabase
    .from('user_settings')
    .select('user_id, chesscom_username, lichess_username')

  if (error) {
    return NextResponse.json(
      { success: false, error: `Failed to fetch users: ${error.message}` },
      { status: 500 },
    )
  }

  const results: Array<{
    userId: string
    source: GameSource
    imported: number
    total: number
    error?: string
  }> = []

  for (const user of users ?? []) {
    if (user.chesscom_username) {
      try {
        const result = await ingestGames(user.chesscom_username, 'chesscom', SYNC_LIMIT)
        results.push({
          userId: user.user_id,
          source: 'chesscom',
          imported: result.imported,
          total: result.total,
        })
      } catch (err: unknown) {
        results.push({
          userId: user.user_id,
          source: 'chesscom',
          imported: 0,
          total: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    if (user.lichess_username) {
      try {
        const result = await ingestGames(user.lichess_username, 'lichess', SYNC_LIMIT)
        results.push({
          userId: user.user_id,
          source: 'lichess',
          imported: result.imported,
          total: result.total,
        })
      } catch (err: unknown) {
        results.push({
          userId: user.user_id,
          source: 'lichess',
          imported: 0,
          total: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }
  }

  return NextResponse.json({ success: true, data: results })
}
