import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/user'

export async function GET() {
  const userId = getUserId()
  const supabase = createServiceClient()

  const [scoresResult, gamesResult, settingsResult] = await Promise.all([
    supabase.from('skill_scores').select('score_type, value').eq('user_id', userId),
    supabase.from('games').select('id, result, user_color, opening_eco, analysis_complete, played_at').eq('user_id', userId),
    supabase.from('user_settings').select('chesscom_username, lichess_username').eq('user_id', userId).single(),
  ])

  const games = gamesResult.data ?? []
  const scores = (scoresResult.data ?? []).map((s: { score_type: string; value: number }) => ({
    scoreType: s.score_type,
    value: s.value,
  }))

  const totalGames = games.length
  const analyzedGames = games.filter((g: { analysis_complete: boolean }) => g.analysis_complete).length

  // Win/draw/loss rates
  const wins = games.filter((g: { result: string; user_color: string }) =>
    (g.result === '1-0' && g.user_color === 'white') || (g.result === '0-1' && g.user_color === 'black'),
  ).length
  const draws = games.filter((g: { result: string }) => g.result === '1/2-1/2').length
  const losses = totalGames - wins - draws

  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  const drawRate = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0
  const lossRate = totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0

  // Opening repertoire stats
  const openingMap: Record<string, { games: number; wins: number }> = {}
  for (const g of games as Array<{ opening_eco: string | null; result: string; user_color: string }>) {
    const eco = g.opening_eco ?? 'Unknown'
    if (!openingMap[eco]) openingMap[eco] = { games: 0, wins: 0 }
    openingMap[eco].games += 1
    const isWin = (g.result === '1-0' && g.user_color === 'white') || (g.result === '0-1' && g.user_color === 'black')
    if (isWin) openingMap[eco].wins += 1
  }

  const openings = Object.entries(openingMap)
    .map(([eco, data]) => ({
      eco,
      games: data.games,
      winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 8)

  // Compute avg accuracy from analyzed moves
  let avgAccuracy = 0
  if (analyzedGames > 0) {
    const analyzedIds = games
      .filter((g: { analysis_complete: boolean }) => g.analysis_complete)
      .map((g: { id: string }) => g.id)

    const { data: moves } = await supabase
      .from('analyzed_moves')
      .select('cp_loss')
      .in('game_id', analyzedIds)

    if (moves && moves.length > 0) {
      const totalCpLoss = (moves as Array<{ cp_loss: number }>).reduce((sum, m) => sum + m.cp_loss, 0)
      const avgCpLoss = totalCpLoss / moves.length
      avgAccuracy = Math.round(Math.max(0, Math.min(100, 100 - avgCpLoss * 0.5)))
    }
  }

  const username = settingsResult.data?.chesscom_username ?? settingsResult.data?.lichess_username ?? 'ChessBot User'

  return NextResponse.json({
    success: true,
    data: {
      username,
      gamesAnalyzed: analyzedGames,
      totalGames,
      avgAccuracy,
      winRate,
      drawRate,
      lossRate,
      scores,
      openings,
    },
  })
}
