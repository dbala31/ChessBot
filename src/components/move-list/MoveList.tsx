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
  [MoveClassification.Best]: 'text-green-400',
  [MoveClassification.Good]: 'text-gray-300',
  [MoveClassification.Inaccuracy]: 'text-yellow-400',
  [MoveClassification.Mistake]: 'text-orange-400',
  [MoveClassification.Blunder]: 'text-red-400',
}

const CLASSIFICATION_ICONS: Record<MoveClassification, string> = {
  [MoveClassification.Best]: '✓',
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

  // Group moves into pairs (white, black)
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
    if (!move) return <span className="w-24" />

    const colorClass = move.classification
      ? CLASSIFICATION_COLORS[move.classification]
      : 'text-gray-300'
    const icon = move.classification
      ? CLASSIFICATION_ICONS[move.classification]
      : ''
    const isActive = move.ply === currentPly

    return (
      <button
        ref={isActive ? activeRef : undefined}
        onClick={() => onClickPly(move.ply)}
        className={`inline-flex w-24 items-center gap-1 rounded px-1.5 py-0.5 text-left font-mono text-sm transition-colors ${colorClass} ${
          isActive ? 'bg-green-600/20 font-bold' : 'hover:bg-gray-800'
        }`}
      >
        <span>{move.san}</span>
        {icon && (
          <span className="text-[10px] opacity-75">{icon}</span>
        )}
      </button>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-800 bg-gray-900">
      <div className="divide-y divide-gray-800/50">
        {pairs.map((pair) => (
          <div
            key={pair.moveNumber}
            className="flex items-center gap-1 px-2 py-0.5"
          >
            <span className="w-8 flex-shrink-0 text-right font-mono text-xs text-gray-500">
              {pair.moveNumber}.
            </span>
            {renderMove(pair.white)}
            {renderMove(pair.black)}
          </div>
        ))}
      </div>
    </div>
  )
}
