import { NextResponse } from 'next/server'
import { ingestGames } from '@/lib/chess-api/ingest'
import type { GameSource } from '@/types'

interface ImportRequestBody {
  readonly username: unknown
  readonly source: unknown
  readonly limit: unknown
}

const VALID_SOURCES: readonly GameSource[] = ['chesscom', 'lichess']
const MAX_LIMIT = 200
const DEFAULT_LIMIT = 100

export async function POST(request: Request) {
  let body: ImportRequestBody
  try {
    body = (await request.json()) as ImportRequestBody
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    )
  }

  const { username, source, limit: rawLimit } = body

  if (typeof username !== 'string' || username.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'username is required' },
      { status: 400 },
    )
  }

  if (!VALID_SOURCES.includes(source as GameSource)) {
    return NextResponse.json(
      { success: false, error: 'source must be "chesscom" or "lichess"' },
      { status: 400 },
    )
  }

  const limit =
    typeof rawLimit === 'number' && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT

  try {
    const result = await ingestGames(
      username.trim(),
      source as GameSource,
      limit,
    )

    return NextResponse.json({
      success: true,
      data: { imported: result.imported, total: result.total },
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Import failed'

    const status = message.includes('not found')
      ? 404
      : message.includes('rate limit')
        ? 429
        : 500

    return NextResponse.json(
      { success: false, error: message },
      { status },
    )
  }
}
