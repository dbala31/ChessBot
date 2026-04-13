'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Board } from '@/components/board/Board'
import { getTopicById, CATEGORY_LABELS } from '@/lib/theory/content'
import { Chess } from 'chess.js'
import type { Key } from 'chessground/types'
import { ArrowLeft, ChevronLeft, ChevronRight, SkipBack, RotateCcw } from 'lucide-react'

export default function TheoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const topic = getTopicById(params.id as string)

  const [currentMoveIndex, setCurrentMoveIndex] = useState(0)

  if (!topic) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Topic not found</p>
      </div>
    )
  }

  // Replay key moves
  const chess = new Chess(topic.fen)
  const positions: Array<{ fen: string; lastMove?: readonly [Key, Key] }> = [
    { fen: topic.fen },
  ]

  const tempChess = new Chess(topic.fen)
  for (const move of topic.keyMoves) {
    const result = tempChess.move(move)
    if (result) {
      positions.push({
        fen: tempChess.fen(),
        lastMove: [result.from as Key, result.to as Key],
      })
    }
  }

  const currentPosition = positions[currentMoveIndex] ?? positions[0]

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/theory')}
        className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs font-medium transition-colors duration-150"
        style={{ color: 'var(--accent)' }}
      >
        <ArrowLeft size={14} /> Back to Theory
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Board + controls */}
        <div>
          <div className="card overflow-hidden p-2">
            <Board
              fen={currentPosition.fen}
              orientation="white"
              lastMove={currentPosition.lastMove}
            />
          </div>

          {/* Move controls */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentMoveIndex(0)}
              disabled={currentMoveIndex === 0}
              className="card cursor-pointer rounded-md p-2 transition-colors duration-150 disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={() => setCurrentMoveIndex((i) => Math.max(0, i - 1))}
              disabled={currentMoveIndex === 0}
              className="card cursor-pointer rounded-md p-2 transition-colors duration-150 disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>

            <span className="min-w-[80px] text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {currentMoveIndex === 0 ? 'Start' : `Move ${currentMoveIndex}`} / {positions.length - 1}
            </span>

            <button
              onClick={() => setCurrentMoveIndex((i) => Math.min(positions.length - 1, i + 1))}
              disabled={currentMoveIndex >= positions.length - 1}
              className="card cursor-pointer rounded-md p-2 transition-colors duration-150 disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Key moves display */}
          {topic.keyMoves.length > 0 && (
            <div className="mt-3 card p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Key Moves
              </p>
              <div className="flex flex-wrap gap-1">
                {topic.keyMoves.map((move, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentMoveIndex(i + 1)}
                    className="cursor-pointer rounded px-2 py-1 font-mono text-xs transition-colors duration-150"
                    style={{
                      background: currentMoveIndex === i + 1 ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                      color: currentMoveIndex === i + 1 ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{move}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {CATEGORY_LABELS[topic.category]}
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            >
              {topic.difficulty}
            </span>
          </div>

          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {topic.title}
          </h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {topic.description}
          </p>

          {/* Content rendered as formatted text */}
          <div className="mt-4 space-y-3">
            {topic.content.split('\n\n').map((paragraph, i) => {
              // Handle bold headers
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={i} className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {paragraph.replace(/\*\*/g, '')}
                  </h3>
                )
              }

              // Handle section headers (lines starting with **)
              const lines = paragraph.split('\n')
              return (
                <div key={i} className="space-y-1">
                  {lines.map((line, j) => {
                    const trimmed = line.trim()
                    if (!trimmed) return null

                    // Bold header line
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                      return (
                        <h3 key={j} className="mt-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {trimmed.replace(/\*\*/g, '')}
                        </h3>
                      )
                    }

                    // Bold label with content (e.g., **Label:** text)
                    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*(.*)$/)
                    if (boldMatch) {
                      return (
                        <p key={j} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{boldMatch[1]}</span>
                          {boldMatch[2]}
                        </p>
                      )
                    }

                    // List items
                    if (trimmed.startsWith('- ')) {
                      return (
                        <p key={j} className="ml-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--accent)' }}>•</span> {trimmed.slice(2)}
                        </p>
                      )
                    }

                    // Numbered items
                    if (/^\d+\./.test(trimmed)) {
                      return (
                        <p key={j} className="ml-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {trimmed}
                        </p>
                      )
                    }

                    // Regular text
                    return (
                      <p key={j} className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {trimmed}
                      </p>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
