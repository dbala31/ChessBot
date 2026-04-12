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
  [MoveClassification.Best]: 'var(--success)',
  [MoveClassification.Good]: 'var(--text-primary)',
  [MoveClassification.Inaccuracy]: 'var(--warning)',
  [MoveClassification.Mistake]: '#f97316',
  [MoveClassification.Blunder]: 'var(--danger)',
}

const CLASSIFICATION_ICONS: Record<MoveClassification, string> = {
  [MoveClassification.Best]: '',
  [MoveClassification.Good]: '',
  [MoveClassification.Inaccuracy]: '?!',
  [MoveClassification.Mistake]: '?',
  [MoveClassification.Blunder]: '??',
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
    const icon = move.classification
      ? CLASSIFICATION_ICONS[move.classification]
      : ''
    const isActive = move.ply === currentPly

    return (
      <button
        ref={isActive ? activeRef : undefined}
        onClick={() => onClickPly(move.ply)}
        className="inline-flex w-20 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-left font-mono text-xs transition-colors duration-100"
        style={{
          color,
          background: isActive ? 'var(--accent-light)' : 'transparent',
          fontWeight: isActive ? 600 : 400,
        }}
      >
        <span>{move.san}</span>
        {icon && <span className="text-[9px] opacity-60">{icon}</span>}
      </button>
    )
  }

  return (
    <div
      className="card max-h-96 overflow-y-auto"
    >
      {pairs.map((pair) => (
        <div
          key={pair.moveNumber}
          className="flex items-center gap-0.5 px-2 py-px"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span className="w-7 flex-shrink-0 text-right font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {pair.moveNumber}.
          </span>
          {renderMove(pair.white)}
          {renderMove(pair.black)}
        </div>
      ))}
    </div>
  )
}
