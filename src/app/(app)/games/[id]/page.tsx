'use client'

import { useState, useCallback, useEffect } from 'react'
import { Board } from '@/components/board/Board'
import { EvalBar } from '@/components/eval-bar/EvalBar'
import { EvalGraph } from '@/components/eval-graph/EvalGraph'
import { MoveList } from '@/components/move-list/MoveList'
import { MoveClassification } from '@/types'
import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import { SkipBack, ChevronLeft, ChevronRight, SkipForward, Sparkles, Target } from 'lucide-react'

// Mock data for design — Italian Game (shortened)
const MOCK_PGN =
  '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. d3 Nf6 5. Nc3 d6 6. Be3 Bb6 7. O-O O-O 8. a3 Be6 9. Bxe6 fxe6 10. b4 d5 11. exd5 exd5 12. Ng5 Qd7 13. d4 exd4 14. Bxd4 Bxd4 15. Qxd4 h6 16. Nf3 Rae8 17. Rfe1 Ne4 18. Nxe4 dxe4 19. Nd2 Qf5 20. Nxe4 Nd4 0-1'

const MOCK_MOVES = (() => {
  const chess = new Chess()
  chess.loadPgn(MOCK_PGN)
  const moves = chess.history({ verbose: true })

  // Generate mock analysis data
  const classifications = [
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Inaccuracy,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Mistake,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Blunder,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Good,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Mistake,
    MoveClassification.Best,
    MoveClassification.Best,
    MoveClassification.Best,
  ]

  return moves.map((m, i) => ({
    ply: i + 1,
    san: m.san,
    from: m.from as Key,
    to: m.to as Key,
    classification: classifications[i % classifications.length],
    cpLoss:
      classifications[i % classifications.length] === MoveClassification.Blunder
        ? 250
        : classifications[i % classifications.length] === MoveClassification.Mistake
          ? 120
          : classifications[i % classifications.length] === MoveClassification.Inaccuracy
            ? 50
            : 5,
  }))
})()

// Generate eval curve (simulating a game where black wins)
const MOCK_EVAL_DATA = MOCK_MOVES.map((_, i) => ({
  ply: i + 1,
  eval: Math.round(30 - i * 8 + Math.sin(i * 0.5) * 40 + (i > 30 ? -100 : 0)),
  classification: MOCK_MOVES[i]?.classification,
}))

export default function GameReviewPage() {
  const [currentPly, setCurrentPly] = useState(0)

  // Compute FEN at current ply
  const chess = new Chess()
  chess.loadPgn(MOCK_PGN)
  const allMoves = chess.history({ verbose: true })

  const replay = new Chess()
  for (let i = 0; i < currentPly && i < allMoves.length; i++) {
    replay.move(allMoves[i].san)
  }

  const currentFen = replay.fen()
  const lastMove =
    currentPly > 0 && currentPly <= allMoves.length
      ? ([allMoves[currentPly - 1].from, allMoves[currentPly - 1].to] as const)
      : undefined

  const currentEval = MOCK_EVAL_DATA[currentPly - 1]?.eval ?? 30

  const goTo = useCallback(
    (ply: number) => {
      setCurrentPly(Math.max(0, Math.min(ply, allMoves.length)))
    },
    [allMoves.length],
  )

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentPly((p) => Math.max(0, p - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentPly((p) => Math.min(allMoves.length, p + 1))
      } else if (e.key === 'Home') {
        e.preventDefault()
        setCurrentPly(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        setCurrentPly(allMoves.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [allMoves.length])

  const navButtons = [
    { key: 'start', icon: SkipBack, action: () => goTo(0) },
    { key: 'prev', icon: ChevronLeft, action: () => goTo(currentPly - 1) },
    { key: 'next', icon: ChevronRight, action: () => goTo(currentPly + 1) },
    { key: 'end', icon: SkipForward, action: () => goTo(allMoves.length) },
  ]

  return (
    <div className="flex h-full flex-col p-4 lg:p-6">
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex gap-2">
          <EvalBar eval={currentEval} />
          <div className="w-[400px] flex-shrink-0 lg:w-[480px]">
            <Board
              fen={currentFen}
              orientation="white"
              lastMove={lastMove as readonly [Key, Key] | undefined}
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <div className="card flex items-center gap-3 px-4 py-2.5 text-xs">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              You vs MagnusFan99
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--danger)' }}>
              0-1
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Lichess</span>
            <span style={{ color: 'var(--text-muted)' }}>5+0 Blitz</span>
          </div>

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
            <MoveList moves={MOCK_MOVES} currentPly={currentPly} onClickPly={goTo} />
          </div>

          {currentPly > 0 &&
            MOCK_MOVES[currentPly - 1]?.classification &&
            (MOCK_MOVES[currentPly - 1].classification === MoveClassification.Mistake ||
              MOCK_MOVES[currentPly - 1].classification === MoveClassification.Blunder) && (
              <div className="flex gap-2">
                <button
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-white transition-colors duration-150"
                  style={{ background: 'var(--accent)' }}
                >
                  <Sparkles size={13} />
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
        </div>
      </div>

      <div className="card mt-4 p-4">
        <EvalGraph data={MOCK_EVAL_DATA} currentPly={currentPly} onClickPly={goTo} />
      </div>
    </div>
  )
}
