'use client'

import { useEffect, useRef } from 'react'
import { Chessground } from 'chessground'
import type { Api } from 'chessground/api'
import type { Key } from 'chessground/types'

interface BoardProps {
  readonly fen: string
  readonly orientation?: 'white' | 'black'
  readonly lastMove?: readonly [Key, Key]
  readonly check?: boolean
  readonly movable?: boolean
  readonly onMove?: (from: Key, to: Key) => void
}

export function Board({
  fen,
  orientation = 'white',
  lastMove,
  check,
  movable = false,
  onMove,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)

  useEffect(() => {
    if (!boardRef.current) return

    if (!apiRef.current) {
      apiRef.current = Chessground(boardRef.current, {
        fen,
        orientation,
        movable: {
          free: movable,
          color: movable ? orientation : undefined,
        },
        lastMove: lastMove ? [...lastMove] : undefined,
        check: check ?? false,
        events: {
          move: (from: Key, to: Key) => {
            onMove?.(from, to)
          },
        },
        animation: { duration: 200 },
        coordinates: true,
      })
    } else {
      apiRef.current.set({
        fen,
        orientation,
        lastMove: lastMove ? [...lastMove] : undefined,
        check: check ?? false,
        movable: {
          free: movable,
          color: movable ? orientation : undefined,
        },
      })
    }
  }, [fen, orientation, lastMove, check, movable, onMove])

  useEffect(() => {
    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [])

  return (
    <div className="aspect-square w-full">
      <div ref={boardRef} className="cg-wrap h-full w-full" />
    </div>
  )
}
