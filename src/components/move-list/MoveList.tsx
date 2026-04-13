'use client'

import { useRef, useEffect } from 'react'
import { MoveClassification } from '@/types'

interface MoveEntry {
  readonly ply: number
  readonly san: string
  readonly classification?: MoveClassification
  readonly cpLoss?: number
}

interface MoveListProps {
  readonly moves: readonly MoveEntry[]
  readonly currentPly: number
  readonly onClickPly: (ply: number) => void
}

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  [MoveClassification.Brilliant]: '#26c6da',
  [MoveClassification.Great]: '#26c6da',
  [MoveClassification.Best]: 'var(--success)',
  [MoveClassification.Excellent]: '#66bb6a',
  [MoveClassification.Good]: 'var(--text-primary)',
  [MoveClassification.Book]: '#8d6e63',
  [MoveClassification.Inaccuracy]: 'var(--warning)',
  [MoveClassification.Dubious]: '#ff9800',
  [MoveClassification.Mistake]: '#f97316',
  [MoveClassification.Miss]: '#ef5350',
  [MoveClassification.Blunder]: 'var(--danger)',
}

const CLASSIFICATION_SYMBOLS: Record<MoveClassification, string> = {
  [MoveClassification.Brilliant]: '!!',
  [MoveClassification.Great]: '!',
  [MoveClassification.Best]: '',
  [MoveClassification.Excellent]: '',
  [MoveClassification.Good]: '',
  [MoveClassification.Book]: '',
  [MoveClassification.Inaccuracy]: '?!',
  [MoveClassification.Dubious]: '?!',
  [MoveClassification.Mistake]: '?',
  [MoveClassification.Miss]: '',
  [MoveClassification.Blunder]: '??',
}

const CLASSIFICATION_DOTS: Record<MoveClassification, string> = {
  [MoveClassification.Brilliant]: '#26c6da',
  [MoveClassification.Great]: '#26c6da',
  [MoveClassification.Best]: 'var(--success)',
  [MoveClassification.Excellent]: '#66bb6a',
  [MoveClassification.Good]: '',
  [MoveClassification.Book]: '#8d6e63',
  [MoveClassification.Inaccuracy]: 'var(--warning)',
  [MoveClassification.Dubious]: '#ff9800',
  [MoveClassification.Mistake]: '#f97316',
  [MoveClassification.Miss]: '#ef5350',
  [MoveClassification.Blunder]: 'var(--danger)',
}

export function MoveList({ moves, currentPly, onClickPly }: MoveListProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentPly])

  const pairs: Array<{
    moveNumber: number
    white: MoveEntry | null
    black: MoveEntry | null
  }> = []

  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i] ?? null,
      black: moves[i + 1] ?? null,
    })
  }

  function renderMove(move: MoveEntry | null) {
    if (!move) return <span className="w-20" />

    const color = move.classification
      ? CLASSIFICATION_COLORS[move.classification]
      : 'var(--text-primary)'
    const symbol = move.classification ? CLASSIFICATION_SYMBOLS[move.classification] : ''
    const dotColor = move.classification ? CLASSIFICATION_DOTS[move.classification] : ''
    const isActive = move.ply === currentPly

    return (
      <button
        ref={isActive ? activeRef : undefined}
        onClick={() => onClickPly(move.ply)}
        className="inline-flex w-24 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-left font-mono text-xs transition-colors duration-100"
        style={{
          color,
          background: isActive ? 'var(--accent-light)' : 'transparent',
          fontWeight: isActive ? 600 : 400,
        }}
        title={
          move.classification
            ? `${move.classification}${move.cpLoss ? ` (${move.cpLoss}cp)` : ''}`
            : undefined
        }
      >
        {dotColor && (
          <span
            className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ background: dotColor }}
          />
        )}
        <span>{move.san}</span>
        {symbol && <span className="text-[9px] font-bold">{symbol}</span>}
      </button>
    )
  }

  return (
    <div className="card max-h-96 overflow-y-auto">
      {pairs.map((pair) => (
        <div
          key={pair.moveNumber}
          className="flex items-center gap-0.5 px-2 py-px"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span
            className="w-7 flex-shrink-0 text-right font-mono text-[10px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {pair.moveNumber}.
          </span>
          {renderMove(pair.white)}
          {renderMove(pair.black)}
        </div>
      ))}
    </div>
  )
}
