import { createServiceClient } from '@/lib/supabase/server'
import { ScoreType, MoveClassification, GamePhase } from '@/types'
import {
  computeTactics,
  computeEndgame,
  computeAdvantageCapitalization,
  computeResourcefulness,
  computeTimeManagement,
  computeOpeningPerformance,
} from './skills'

interface AnalyzedMoveRow {
  readonly cp_loss: number
  readonly classification: string
  readonly phase: string
  readonly eval_before: number
  readonly eval_after: number
  readonly time_spent: number | null
}

interface SkillResult {
  readonly scoreType: ScoreType
  readonly value: number
}

function mapRow(row: AnalyzedMoveRow) {
  return {
    cpLoss: row.cp_loss,
    classification: row.classification as MoveClassification,
    phase: row.phase as GamePhase,
    evalBefore: row.eval_before,
    evalAfter: row.eval_after,
    timeSpent: row.time_spent,
  }
}

export async function computeAllSkills(userId: string): Promise<readonly SkillResult[]> {
  const supabase = createServiceClient()

  // Fetch user's rating for relative scoring
  const { data: settings } = await supabase
    .from('user_settings')
    .select('current_rating')
    .eq('user_id', userId)
    .single()

  const rating = settings?.current_rating ?? 1200

  // Fetch analyzed moves from the user's last 200 games
  const { data: games } = await supabase
    .from('games')
    .select('id')
    .eq('user_id', userId)
    .eq('analysis_complete', true)
    .order('played_at', { ascending: false })
    .limit(200)

  if (!games || games.length === 0) {
    return []
  }

  const gameIds = games.map((g: { id: string }) => g.id)

  const { data: moves } = await supabase
    .from('analyzed_moves')
    .select('cp_loss, classification, phase, eval_before, eval_after, time_spent')
    .in('game_id', gameIds)

  if (!moves || moves.length === 0) {
    return []
  }

  const mapped = (moves as AnalyzedMoveRow[]).map(mapRow)

  const scores: SkillResult[] = [
    { scoreType: ScoreType.Tactics, value: computeTactics(mapped, rating) },
    { scoreType: ScoreType.Endgame, value: computeEndgame(mapped, rating) },
    {
      scoreType: ScoreType.AdvantageCapitalization,
      value: computeAdvantageCapitalization(mapped, rating),
    },
    {
      scoreType: ScoreType.Resourcefulness,
      value: computeResourcefulness(mapped, rating),
    },
    {
      scoreType: ScoreType.TimeManagement,
      value: computeTimeManagement(mapped),
    },
    {
      scoreType: ScoreType.OpeningPerformance,
      value: computeOpeningPerformance(mapped, rating),
    },
  ]

  // Store scores
  const now = new Date().toISOString()
  const rows = scores.map((s) => ({
    user_id: userId,
    score_type: s.scoreType,
    value: s.value,
    computed_at: now,
  }))

  await supabase.from('skill_scores').upsert(rows, {
    onConflict: 'user_id,score_type',
  })

  return scores
}
