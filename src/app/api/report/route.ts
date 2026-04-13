import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserIdFromSession } from '@/lib/auth/session'

export async function GET() {
  const userId = await getUserIdFromSession()
  const supabase = createServiceClient()

  const [scoresResult, gamesResult, settingsResult] = await Promise.all([
    supabase.from('skill_scores').select('score_type, value').eq('user_id', userId),
    supabase
      .from('games')
      .select('id, result, user_color, opening_eco, analysis_complete, played_at, time_control')
      .eq('user_id', userId),
    supabase
      .from('user_settings')
      .select('chesscom_username, lichess_username, current_rating, target_rating')
      .eq('user_id', userId)
      .single(),
  ])

  const games = gamesResult.data ?? []
  const scores = (scoresResult.data ?? []).map((s: { score_type: string; value: number }) => ({
    scoreType: s.score_type,
    value: s.value,
  }))

  const totalGames = games.length
  const analyzedGames = games.filter(
    (g: { analysis_complete: boolean }) => g.analysis_complete,
  ).length
  const analyzedIds = games
    .filter((g: { analysis_complete: boolean }) => g.analysis_complete)
    .map((g: { id: string }) => g.id)

  // Win/draw/loss
  const wins = games.filter(
    (g: { result: string; user_color: string }) =>
      (g.result === '1-0' && g.user_color === 'white') ||
      (g.result === '0-1' && g.user_color === 'black'),
  ).length
  const draws = games.filter((g: { result: string }) => g.result === '1/2-1/2').length
  const losses = totalGames - wins - draws
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
  const drawRate = totalGames > 0 ? Math.round((draws / totalGames) * 100) : 0
  const lossRate = totalGames > 0 ? Math.round((losses / totalGames) * 100) : 0

  // Fetch all analyzed moves
  let allMoves: Array<{
    game_id: string
    ply: number
    cp_loss: number
    classification: string
    phase: string
    eval_before: number
    eval_after: number
  }> = []

  if (analyzedIds.length > 0) {
    const { data: moves } = await supabase
      .from('analyzed_moves')
      .select('game_id, ply, cp_loss, classification, phase, eval_before, eval_after')
      .in('game_id', analyzedIds)

    allMoves = (moves ?? []) as typeof allMoves
  }

  // Per-phase stats
  const phases = ['opening', 'middlegame', 'endgame'] as const
  const phaseStats = phases.map((phase) => {
    const phaseMoves = allMoves.filter((m) => m.phase === phase)
    if (phaseMoves.length === 0)
      return {
        phase,
        moveCount: 0,
        avgCpLoss: 0,
        blunders: 0,
        mistakes: 0,
        bestMoves: 0,
        accuracy: 0,
      }

    const avgCpLoss = Math.round(phaseMoves.reduce((s, m) => s + m.cp_loss, 0) / phaseMoves.length)
    const blunders = phaseMoves.filter((m) => m.classification === 'blunder').length
    const mistakes = phaseMoves.filter((m) => m.classification === 'mistake').length
    const bestMoves = phaseMoves.filter((m) => m.classification === 'best').length
    const accuracy = Math.round(Math.max(0, Math.min(100, 100 - avgCpLoss * 0.5)))

    return {
      phase,
      moveCount: phaseMoves.length,
      avgCpLoss,
      blunders,
      mistakes,
      bestMoves,
      accuracy,
    }
  })

  // Overall stats
  let avgAccuracy = 0
  let avgCpLoss = 0
  let totalBlunders = 0
  let totalMistakes = 0
  let totalBestMoves = 0

  if (allMoves.length > 0) {
    avgCpLoss = Math.round(allMoves.reduce((s, m) => s + m.cp_loss, 0) / allMoves.length)
    avgAccuracy = Math.round(Math.max(0, Math.min(100, 100 - avgCpLoss * 0.5)))
    totalBlunders = allMoves.filter((m) => m.classification === 'blunder').length
    totalMistakes = allMoves.filter((m) => m.classification === 'mistake').length
    totalBestMoves = allMoves.filter((m) => m.classification === 'best').length
  }

  // Opening repertoire
  const openingMap: Record<
    string,
    { games: number; wins: number; cpLossSum: number; moveCount: number }
  > = {}
  for (const g of games as Array<{
    id: string
    opening_eco: string | null
    result: string
    user_color: string
  }>) {
    const eco = g.opening_eco ?? 'Unknown'
    if (!openingMap[eco]) openingMap[eco] = { games: 0, wins: 0, cpLossSum: 0, moveCount: 0 }
    openingMap[eco].games += 1
    const isWin =
      (g.result === '1-0' && g.user_color === 'white') ||
      (g.result === '0-1' && g.user_color === 'black')
    if (isWin) openingMap[eco].wins += 1

    const gameMoves = allMoves.filter((m) => m.game_id === g.id && m.phase === 'opening')
    openingMap[eco].cpLossSum += gameMoves.reduce((s, m) => s + m.cp_loss, 0)
    openingMap[eco].moveCount += gameMoves.length
  }

  const openings = Object.entries(openingMap)
    .filter(([, d]) => d.games >= 2)
    .map(([eco, data]) => ({
      eco,
      games: data.games,
      winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
      avgCpLoss: data.moveCount > 0 ? Math.round(data.cpLossSum / data.moveCount) : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 10)

  // Blunder patterns
  const blunderMoves = allMoves.filter((m) => m.classification === 'blunder')
  const blunderByPhase = {
    opening: blunderMoves.filter((m) => m.phase === 'opening').length,
    middlegame: blunderMoves.filter((m) => m.phase === 'middlegame').length,
    endgame: blunderMoves.filter((m) => m.phase === 'endgame').length,
  }
  const blundersFromWinning = blunderMoves.filter((m) => m.eval_before >= 100).length
  const blundersFromEqual = blunderMoves.filter(
    (m) => m.eval_before > -100 && m.eval_before < 100,
  ).length
  const blundersFromLosing = blunderMoves.filter((m) => m.eval_before <= -100).length

  // Advantage conversion
  const advantageMoves = allMoves.filter((m) => m.eval_before >= 150)
  const advantageErrors = advantageMoves.filter(
    (m) => m.classification === 'blunder' || m.classification === 'mistake',
  ).length
  const advantageAccuracy =
    advantageMoves.length > 0
      ? Math.round(((advantageMoves.length - advantageErrors) / advantageMoves.length) * 100)
      : 0

  // Defense
  const defenseMoves = allMoves.filter((m) => m.eval_before <= -150)
  const defenseErrors = defenseMoves.filter(
    (m) => m.classification === 'blunder' || m.classification === 'mistake',
  ).length
  const defenseAccuracy =
    defenseMoves.length > 0
      ? Math.round(((defenseMoves.length - defenseErrors) / defenseMoves.length) * 100)
      : 0

  const currentRating = settingsResult.data?.current_rating ?? null
  const targetRating = settingsResult.data?.target_rating ?? null
  const username =
    settingsResult.data?.chesscom_username ??
    settingsResult.data?.lichess_username ??
    'ChessBot User'

  return NextResponse.json({
    success: true,
    data: {
      username,
      currentRating,
      targetRating,
      gamesAnalyzed: analyzedGames,
      totalGames,
      avgAccuracy,
      avgCpLoss,
      winRate,
      drawRate,
      lossRate,
      totalBlunders,
      totalMistakes,
      totalBestMoves,
      totalMoves: allMoves.length,
      scores,
      phaseStats,
      openings,
      blunderPatterns: {
        byPhase: blunderByPhase,
        fromWinning: blundersFromWinning,
        fromEqual: blundersFromEqual,
        fromLosing: blundersFromLosing,
        total: blunderMoves.length,
      },
      advantageConversion: {
        movesInAdvantage: advantageMoves.length,
        errorsInAdvantage: advantageErrors,
        accuracy: advantageAccuracy,
      },
      defense: {
        movesDefending: defenseMoves.length,
        errorsDefending: defenseErrors,
        accuracy: defenseAccuracy,
      },
    },
  })
}
