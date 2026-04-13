'use client'

import { useState, useCallback } from 'react'
import { Board } from '@/components/board/Board'
import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import { Check, X, Sparkles, RotateCcw } from 'lucide-react'

interface DrillCardProps {
  readonly fen: string
  readonly solutionPv: string
  readonly onResult: (correct: boolean, timeMs: number) => void
}

type DrillState = 'playing' | 'correct' | 'incorrect'

export function DrillCard({ fen, solutionPv, onResult }: DrillCardProps) {
  const [state, setState] = useState<DrillState>('playing')
  const [startTime] = useState(() => Date.now())

  const chess = new Chess(fen)
  const turn = chess.turn() === 'w' ? 'white' : 'black'

  // Parse solution — first move in PV (UCI format like "e2e4")
  const solutionFrom = solutionPv.slice(0, 2) as Key
  const solutionTo = solutionPv.slice(2, 4) as Key

  const handleMove = useCallback(
    (from: Key, to: Key) => {
      const elapsed = Date.now() - startTime
      if (from === solutionFrom && to === solutionTo) {
        setState('correct')
        onResult(true, elapsed)
      } else {
        setState('incorrect')
        onResult(false, elapsed)
      }
    },
    [solutionFrom, solutionTo, onResult, startTime],
  )

  return (
    <div>
      <div className="card overflow-hidden p-2">
        <Board fen={fen} orientation={turn} movable={state === 'playing'} onMove={handleMove} />
      </div>

      {/* Feedback */}
      {state === 'correct' && (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-4 py-3"
          style={{ background: 'var(--success-light)', border: '1px solid var(--success)' }}
        >
          <Check size={16} style={{ color: 'var(--success)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
            Correct!
          </span>
        </div>
      )}

      {state === 'incorrect' && (
        <div
          className="mt-3 rounded-lg px-4 py-3"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)' }}
        >
          <div className="flex items-center gap-2">
            <X size={16} style={{ color: 'var(--danger)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>
              Incorrect
            </span>
          </div>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Best move was{' '}
            <span className="font-mono font-semibold">
              {solutionFrom}→{solutionTo}
            </span>
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setState('playing')}
              className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <RotateCcw size={11} /> Try again
            </button>
            <button
              className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150"
              style={{ background: 'var(--accent)' }}
            >
              <Sparkles size={11} /> Explain
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
