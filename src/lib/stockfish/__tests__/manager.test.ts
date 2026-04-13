import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StockfishManager } from '../manager'
import type { StockfishResult } from '@/types'

// ── Mock Worker ───────────────────────────────────────────────────────────────

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  private handlers: Array<(command: string) => void> = []

  postMessage(data: unknown) {
    const msg = data as { type: string; command: string }
    if (msg.type === 'uci-command') {
      // Simulate UCI responses
      setTimeout(() => {
        if (msg.command === 'isready') {
          this.respond('readyok')
        } else if (msg.command.startsWith('go depth')) {
          this.respond('info depth 18 score cp 30 pv e2e4 e7e5 g1f3')
          this.respond('bestmove e2e4 ponder e7e5')
        }
      }, 0)
    }
  }

  respond(line: string) {
    this.onmessage?.({
      data: { type: 'uci-output', line },
    } as MessageEvent)
  }

  terminate() {}
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StockfishManager', () => {
  let manager: StockfishManager
  let mockWorker: MockWorker

  beforeEach(() => {
    mockWorker = new MockWorker()
    // Inject mock worker
    manager = new StockfishManager(mockWorker as unknown as Worker)
  })

  afterEach(() => {
    manager.destroy()
  })

  it('analyzes a position and returns eval + best move', async () => {
    const result = await manager.analyzePosition(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      18,
    )

    expect(result).toMatchObject({
      bestMove: 'e2e4',
      eval: 30,
      isMate: false,
    })
  })

  it('parses mate scores correctly', async () => {
    // Override mock to return mate score
    const origPost = mockWorker.postMessage.bind(mockWorker)
    mockWorker.postMessage = function (data: unknown) {
      const msg = data as { type: string; command: string }
      if (msg.type === 'uci-command' && msg.command.startsWith('go depth')) {
        setTimeout(() => {
          mockWorker.respond('info depth 18 score mate 3 pv e2e4 e7e5 d1h5')
          mockWorker.respond('bestmove e2e4 ponder e7e5')
        }, 0)
      } else {
        origPost(data)
      }
    }

    const result = await manager.analyzePosition('some-fen w - - 0 1', 18)

    expect(result.isMate).toBe(true)
    expect(result.mateIn).toBe(3)
  })

  it('queues multiple analysis requests', async () => {
    const p1 = manager.analyzePosition(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      18,
    )
    const p2 = manager.analyzePosition(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
      18,
    )

    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1.bestMove).toBe('e2e4')
    expect(r2.bestMove).toBe('e2e4')
  })
})
