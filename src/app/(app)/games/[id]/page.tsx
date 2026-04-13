'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Board } from '@/components/board/Board'
import { EvalBar } from '@/components/eval-bar/EvalBar'
import { EvalGraph } from '@/components/eval-graph/EvalGraph'
import { MoveList } from '@/components/move-list/MoveList'
import { MoveClassification, GamePhase } from '@/types'
import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Sparkles,
  Target,
  Loader2,
  X as XIcon,
  AlertCircle,
} from 'lucide-react'
import type { ExplainMoveRequest } from '@/types'

interface AnalyzedMoveData {
  readonly ply: number
  readonly fenBefore: string
  readonly playedMove: string
  readonly bestMove: string
  readonly evalBefore: number
  readonly evalAfter: number
  readonly cpLoss: number
  readonly classification: string
  readonly phase: string
}

interface GameData {
  readonly id: string
  readonly pgn: string
  readonly source: string
  readonly result: string
  readonly userColor: string
  readonly timeControl: string
  readonly opponent: string
  readonly analysisComplete: boolean
  readonly moves: readonly AnalyzedMoveData[]
}

export default function GameReviewPage() {
  const params = useParams()
  const gameId = params.id as string

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPly, setCurrentPly] = useState(0)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [explainPly, setExplainPly] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/games/${gameId}`)
        const data = await res.json()
        if (data.success) {
          setGameData(data.data)
        } else {
          setError(data.error ?? 'Failed to load game')
        }
      } catch {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [gameId])

  // Parse PGN moves
  const pgnMoves = (() => {
    if (!gameData?.pgn) return []
    try {
      const chess = new Chess()
      chess.loadPgn(gameData.pgn)
      return chess.history({ verbose: true })
    } catch {
      return []
    }
  })()

  // Build move list with analysis data
  const moveList = pgnMoves.map((m, i) => {
    const analysisMove = gameData?.moves.find((am) => am.ply === i + 1)
    return {
      ply: i + 1,
      san: m.san,
      from: m.from as Key,
      to: m.to as Key,
      classification: analysisMove
        ? (analysisMove.classification as MoveClassification)
        : undefined,
      cpLoss: analysisMove?.cpLoss ?? 0,
    }
  })

  // Build eval data from analysis
  const evalData = gameData?.moves.map((m) => ({
    ply: m.ply,
    eval: Math.round(m.evalBefore),
    classification: m.classification as MoveClassification,
  })) ?? []

  const handleExplain = useCallback(async (ply: number) => {
    const move = moveList[ply - 1]
    const analysisMove = gameData?.moves.find((am) => am.ply === ply)
    if (!move || !analysisMove) return

    setIsExplaining(true)
    setExplainPly(ply)
    setExplanation(null)

    const req: ExplainMoveRequest = {
      fen: analysisMove.fenBefore,
      playedMove: move.san,
      bestMove: analysisMove.bestMove,
      cpLoss: analysisMove.cpLoss,
      phase: analysisMove.phase as GamePhase,
    }

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      setExplanation(data.explanation ?? data.error ?? 'No explanation available.')
    } catch {
      setExplanation('Failed to fetch explanation. Please try again.')
    } finally {
      setIsExplaining(false)
    }
  }, [moveList, gameData?.moves])

  // Compute FEN at current ply
  const replay = new Chess()
  for (let i = 0; i < currentPly && i < pgnMoves.length; i++) {
    replay.move(pgnMoves[i].san)
  }
  const currentFen = replay.fen()
  const lastMove =
    currentPly > 0 && currentPly <= pgnMoves.length
      ? ([pgnMoves[currentPly - 1].from, pgnMoves[currentPly - 1].to] as const)
      : undefined

  const currentEval = evalData.find((e) => e.ply === currentPly)?.eval ?? 30

  const goTo = useCallback(
    (ply: number) => {
      setCurrentPly(Math.max(0, Math.min(ply, pgnMoves.length)))
    },
    [pgnMoves.length],
  )

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentPly((p) => Math.max(0, p - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentPly((p) => Math.min(pgnMoves.length, p + 1))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrentPly(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrentPly(pgnMoves.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pgnMoves.length])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
        <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading game...</span>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="flex h-full items-center justify-center">
        <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
        <span className="ml-2 text-sm" style={{ color: 'var(--danger)' }}>{error ?? 'Game not found'}</span>
      </div>
    )
  }

  const navButtons = [
    { key: 'start', icon: SkipBack, action: () => goTo(0) },
    { key: 'prev', icon: ChevronLeft, action: () => goTo(currentPly - 1) },
    { key: 'next', icon: ChevronRight, action: () => goTo(currentPly + 1) },
    { key: 'end', icon: SkipForward, action: () => goTo(pgnMoves.length) },
  ]

  const currentMoveClassification = moveList[currentPly - 1]?.classification

  return (
    <div className="flex h-full flex-col p-3 md:p-4 lg:p-6">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden lg:flex-row">
        <div className="flex gap-2">
          <EvalBar eval={currentEval} />
          <div className="w-full max-w-[480px] flex-shrink-0 md:w-[400px] lg:w-[480px]">
            <Board
              fen={currentFen}
              orientation={gameData.userColor === 'black' ? 'black' : 'white'}
              lastMove={lastMove as readonly [Key, Key] | undefined}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="card flex items-center gap-3 px-4 py-2.5 text-xs">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              You vs {gameData.opponent}
            </span>
            <span className="font-mono font-bold" style={{
              color: gameData.result === '1-0' ? 'var(--success)' : gameData.result === '0-1' ? 'var(--danger)' : 'var(--warning)',
            }}>
              {gameData.result}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>{gameData.source === 'lichess' ? 'Lichess' : 'Chess.com'}</span>
            <span style={{ color: 'var(--text-muted)' }}>{gameData.timeControl}</span>
          </div>

          {!gameData.analysisComplete && (
            <div className="rounded-lg px-4 py-2.5 text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
              Game not yet analyzed. Go to Settings to run Stockfish analysis.
            </div>
          )}

          <div className="flex gap-1">
            {navButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={btn.action}
                className="card cursor-pointer rounded-md p-2 transition-colors duration-150"
                style={{ color: 'var(--text-secondary)' }}
              >
                <btn.icon size={16} />
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            <MoveList moves={moveList} currentPly={currentPly} onClickPly={goTo} />
          </div>

          {currentPly > 0 && currentMoveClassification &&
            (currentMoveClassification === MoveClassification.Mistake ||
              currentMoveClassification === MoveClassification.Blunder) && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleExplain(currentPly)}
                  disabled={isExplaining}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors duration-150 disabled:opacity-60"
                  style={{ background: 'var(--accent)' }}
                >
                  {isExplaining && explainPly === currentPly ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  Explain with AI
                </button>
                <button
                  className="card flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Target size={13} />
                  Practice this
                </button>
              </div>
            )}

          {explanation && explainPly !== null && (
            <div
              className="card mt-2 rounded-lg p-4"
              style={{ borderLeft: '3px solid var(--accent)' }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  <Sparkles size={13} />
                  AI Explanation — Move {explainPly}
                </span>
                <button
                  onClick={() => {
                    setExplanation(null)
                    setExplainPly(null)
                  }}
                  className="cursor-pointer rounded p-0.5 transition-colors duration-150"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <XIcon size={14} />
                </button>
              </div>
              <div
                className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {evalData.length > 0 && (
        <div className="card mt-4 p-4">
          <EvalGraph data={evalData} currentPly={currentPly} onClickPly={goTo} />
        </div>
      )}
    </div>
  )
}
