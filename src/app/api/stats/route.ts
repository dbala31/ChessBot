import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getUserId } from '@/lib/auth/user'

export async function GET() {
  const userId = getUserId()
  const supabase = createServiceClient()

  // Parallel queries
  const [gamesResult, scoresResult, drillsResult, recentGamesResult] = await Promise.all([
    // Total analyzed games
    supabase
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('analysis_complete', true),

    // Latest skill scores
    supabase
      .from('skill_scores')
      .select('score_type, value')
      .eq('user_id', userId),

    // Drills completed today
    supabase
      .from('drill_attempts')
      .select('id, correct, attempted_at')
      .eq('user_id', userId)
      .gte('attempted_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    // Recent 5 games with PGN for opponent extraction
    supabase
      .from('games')
      .select('id, pgn, source, result, user_color, time_control, played_at, analysis_complete')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(5),
  ])

  // Compute training streak (consecutive days with at least 1 drill)
  const { data: recentDrills } = await supabase
    .from('drill_attempts')
    .select('attempted_at')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(500)

  let streak = 0
  if (recentDrills && recentDrills.length > 0) {
    const drillDates = new Set(
      recentDrills.map((d: { attempted_at: string }) =>
        new Date(d.attempted_at).toISOString().slice(0, 10),
      ),
    )
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      if (drillDates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }
  }

  // Get accuracy for recent games
  const recentGames = recentGamesResult.data ?? []
  const analyzedIds = recentGames
    .filter((g: { analysis_complete: boolean }) => g.analysis_complete)
    .map((g: { id: string }) => g.id)

  let accuracyMap: Record<string, { accuracy: number; blunders: number }> = {}
  if (analyzedIds.length > 0) {
    const { data: moveStats } = await supabase
      .from('analyzed_moves')
      .select('game_id, cp_loss, classification')
      .in('game_id', analyzedIds)

    if (moveStats) {
      const grouped: Record<string, { totalCpLoss: number; count: number; blunders: number }> = {}
      for (const row of moveStats as Array<{ game_id: string; cp_loss: number; classification: string }>) {
        if (!grouped[row.game_id]) {
          grouped[row.game_id] = { totalCpLoss: 0, count: 0, blunders: 0 }
        }
        grouped[row.game_id].totalCpLoss += row.cp_loss
        grouped[row.game_id].count += 1
        if (row.classification === 'blunder') grouped[row.game_id].blunders += 1
      }
      for (const [gid, data] of Object.entries(grouped)) {
        const avg = data.count > 0 ? data.totalCpLoss / data.count : 0
        accuracyMap[gid] = {
          accuracy: Math.round(Math.max(0, Math.min(100, 100 - avg * 0.5))),
          blunders: data.blunders,
        }
      }
    }
  }

  function extractOpponent(pgn: string, userColor: string): string {
    const whiteMatch = pgn.match(/\[White "([^"]+)"\]/)
    const blackMatch = pgn.match(/\[Black "([^"]+)"\]/)
    return userColor === 'white' ? blackMatch?.[1] ?? 'Unknown' : whiteMatch?.[1] ?? 'Unknown'
  }

  const drillsToday = drillsResult.data ?? []
  const drillsCorrect = drillsToday.filter((d: { correct: boolean }) => d.correct).length

  return NextResponse.json({
    success: true,
    data: {
      gamesAnalyzed: gamesResult.count ?? 0,
      streak,
      drillsToday: drillsToday.length,
      drillsCorrect,
      drillsTarget: 15,
      scores: (scoresResult.data ?? []).map((s: { score_type: string; value: number }) => ({
        scoreType: s.score_type,
        value: s.value,
      })),
      recentGames: recentGames.map((g: {
        id: string
        pgn: string
        source: string
        result: string
        user_color: string
        time_control: string
        played_at: string
        analysis_complete: boolean
      }) => ({
        id: g.id,
        opponent: extractOpponent(g.pgn, g.user_color),
        result: g.result,
        timeControl: g.time_control,
        source: g.source,
        playedAt: g.played_at,
        accuracy: accuracyMap[g.id]?.accuracy ?? null,
        blunders: accuracyMap[g.id]?.blunders ?? null,
      })),
    },
  })
}
