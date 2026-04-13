import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GamePhase } from '@/types'
import type { ExplainMoveRequest } from '@/types'

const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn()
  const mockGetGenerativeModel = vi.fn(() => ({
    generateContent: mockGenerateContent,
  }))
  return { mockGenerateContent, mockGetGenerativeModel }
})

vi.mock('@google/generative-ai', () => {
  function MockGoogleGenerativeAI() {
    return { getGenerativeModel: mockGetGenerativeModel }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI }
})

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null })),
        })),
      })),
      upsert: vi.fn(() => ({ error: null })),
    })),
  })),
}))

const REQ: ExplainMoveRequest = {
  fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
  playedMove: 'd5',
  bestMove: 'e5',
  cpLoss: 45,
  phase: GamePhase.Opening,
}

describe('explainMove', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('calls Gemini and returns explanation text', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'This is an explanation.' },
    })

    const { explainMove } = await import('../client')
    const result = await explainMove(REQ)

    expect(result).toBe('This is an explanation.')
    expect(mockGenerateContent).toHaveBeenCalledOnce()
  })

  it('passes a prompt containing the FEN and moves', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'Explanation' },
    })

    const { explainMove } = await import('../client')
    await explainMove(REQ)

    const prompt = mockGenerateContent.mock.calls[0][0] as string
    expect(prompt).toContain(REQ.fen)
    expect(prompt).toContain(REQ.playedMove)
    expect(prompt).toContain(REQ.bestMove)
  })
})
