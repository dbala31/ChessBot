import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ExplainMoveRequest } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'

let _genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  }
  return _genAI
}

function buildPrompt(req: ExplainMoveRequest): string {
  return `You are an expert chess coach explaining a move to an intermediate-level player (1200-1800 ELO).

Position (FEN): ${req.fen}
Game phase: ${req.phase}
Move played: ${req.playedMove}
Best move (by engine): ${req.bestMove}
Centipawn loss: ${req.cpLoss}

Explain:
1. Why the played move is suboptimal — what does it miss or allow?
2. Why the best move is better — what does it achieve tactically or positionally?
3. A concrete takeaway the player can apply in similar positions.

Keep it to 2-3 short paragraphs. Use algebraic notation. Be encouraging but direct.`
}

function cacheKey(req: ExplainMoveRequest): string {
  return `${req.fen}|${req.playedMove}|${req.bestMove}`
}

async function getCached(key: string): Promise<string | null> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('explanation_cache')
      .select('explanation')
      .eq('cache_key', key)
      .single()
    return data?.explanation ?? null
  } catch {
    return null
  }
}

async function setCache(key: string, explanation: string): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase
      .from('explanation_cache')
      .upsert({ cache_key: key, explanation, created_at: new Date().toISOString() })
  } catch {
    // Cache write failure is non-critical
  }
}

export async function explainMove(req: ExplainMoveRequest): Promise<string> {
  const key = cacheKey(req)

  const cached = await getCached(key)
  if (cached) return cached

  const model = getGenAI().getGenerativeModel({ model: 'gemini-2.5-flash' })
  const result = await model.generateContent(buildPrompt(req))
  const explanation = result.response.text()

  await setCache(key, explanation)

  return explanation
}
