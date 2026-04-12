import type { StockfishResult, AnalysisProgress } from '@/types'
import { Chess } from 'chess.js'
import { classifyMove, determinePhase } from '@/lib/analysis/classify'
import type { MoveClassification, GamePhase } from '@/types'

const DEFAULT_DEPTH = 18

interface AnalyzedMoveResult {
  readonly ply: number
  readonly fenBefore: string
  readonly playedMove: string
  readonly bestMove: string
  readonly evalBefore: number
  readonly evalAfter: number
  readonly cpLoss: number
  readonly classification: MoveClassification
  readonly phase: GamePhase
}

interface QueueItem {
  readonly fen: string
  readonly depth: number
  readonly resolve: (result: StockfishResult) => void
  readonly reject: (error: Error) => void
}

interface UciInfo {
  score: number
  isMate: boolean
  mateIn: number | null
  pv: readonly string[]
  bestMove: string
}

function parseInfoLine(line: string): Partial<UciInfo> {
  const result: Partial<UciInfo> = {}

  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/)
  if (scoreMatch) {
    if (scoreMatch[1] === 'cp') {
      result.score = parseInt(scoreMatch[2], 10)
      result.isMate = false
    } else {
      result.isMate = true
      result.mateIn = parseInt(scoreMatch[2], 10)
      // Convert mate score to centipawns (large value)
      result.score = parseInt(scoreMatch[2], 10) > 0 ? 10000 : -10000
    }
  }

  const pvMatch = line.match(/\bpv\s+(.+)$/)
  if (pvMatch) {
    result.pv = pvMatch[1].split(/\s+/)
  }

  return result
}

export class StockfishManager {
  private readonly worker: Worker
  private queue: QueueItem[] = []
  private processing = false
  private currentInfo: Partial<UciInfo> = {}
  private destroyed = false

  constructor(worker: Worker) {
    this.worker = worker

    this.worker.onmessage = (event: MessageEvent) => {
      const data = event.data as {
        type: string
        line?: string
        error?: string
      }

      if (data.type === 'uci-output' && data.line) {
        this.handleUciOutput(data.line)
      }
    }
  }

  private handleUciOutput(line: string) {
    if (line.startsWith('info') && line.includes('score')) {
      const parsed = parseInfoLine(line)
      this.currentInfo = { ...this.currentInfo, ...parsed }
    }

    if (line.startsWith('bestmove')) {
      const bestMove = line.split(/\s+/)[1]
      this.currentInfo.bestMove = bestMove

      const current = this.queue[0]
      if (current) {
        this.queue = this.queue.slice(1)
        current.resolve({
          fen: current.fen,
          bestMove: this.currentInfo.bestMove ?? bestMove,
          eval: this.currentInfo.score ?? 0,
          isMate: this.currentInfo.isMate ?? false,
          mateIn: this.currentInfo.mateIn ?? null,
          pv: this.currentInfo.pv ?? [bestMove],
        })

        this.currentInfo = {}
        this.processNext()
      }
    }

    if (line === 'readyok') {
      // Engine is ready
    }
  }

  private sendCommand(command: string) {
    this.worker.postMessage({ type: 'uci-command', command })
  }

  private processNext() {
    if (this.queue.length === 0 || this.destroyed) {
      this.processing = false
      return
    }

    this.processing = true
    const item = this.queue[0]
    this.currentInfo = {}

    this.sendCommand(`position fen ${item.fen}`)
    this.sendCommand(`go depth ${item.depth}`)
  }

  analyzePosition(
    fen: string,
    depth: number = DEFAULT_DEPTH,
  ): Promise<StockfishResult> {
    return new Promise((resolve, reject) => {
      if (this.destroyed) {
        reject(new Error('StockfishManager has been destroyed'))
        return
      }

      this.queue = [...this.queue, { fen, depth, resolve, reject }]

      if (!this.processing) {
        this.processNext()
      }
    })
  }

  async analyzeGame(
    pgn: string,
    onProgress?: (progress: AnalysisProgress) => void,
  ): Promise<readonly AnalyzedMoveResult[]> {
    const chess = new Chess()
    chess.loadPgn(pgn)
    const moves = chess.history({ verbose: true })

    const results: AnalyzedMoveResult[] = []
    const replay = new Chess()

    for (let i = 0; i < moves.length; i++) {
      const fenBefore = replay.fen()
      const ply = i + 1

      // Get eval before the move
      const evalBefore = await this.analyzePosition(fenBefore)

      // Make the move
      replay.move(moves[i].san)
      const fenAfter = replay.fen()

      // Get eval after the move
      const evalAfter = await this.analyzePosition(fenAfter)

      // Eval is from the perspective of the side to move.
      // After a move, the side to move flips, so we negate evalAfter for comparison.
      const evalBeforeCp = evalBefore.eval
      const evalAfterCp = -evalAfter.eval

      const cpLoss = Math.max(0, evalBeforeCp - evalAfterCp)

      results.push({
        ply,
        fenBefore,
        playedMove: moves[i].lan,
        bestMove: evalBefore.bestMove,
        evalBefore: evalBeforeCp,
        evalAfter: evalAfterCp,
        cpLoss,
        classification: classifyMove(cpLoss),
        phase: determinePhase(fenBefore, ply),
      })

      onProgress?.({
        currentGame: 1,
        totalGames: 1,
        currentGameId: '',
        currentPly: ply,
        totalPlies: moves.length,
      })
    }

    return results
  }

  stop() {
    this.sendCommand('stop')
  }

  destroy() {
    this.destroyed = true
    this.stop()
    this.worker.terminate()

    // Reject any pending items
    for (const item of this.queue) {
      item.reject(new Error('StockfishManager destroyed'))
    }
    this.queue = []
  }
}
