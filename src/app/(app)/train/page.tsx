'use client'

import { Board } from '@/components/board/Board'
import { Lightbulb, Sparkles, SkipForward, AlertTriangle } from 'lucide-react'

const MOCK_PUZZLE = {
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  theme: "Scholar's Mate",
  difficulty: 1200,
}

export default function TrainPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Daily Training
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              15 puzzles targeting your weaknesses
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>8/10</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>correct</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span style={{ color: 'var(--text-muted)' }}>Puzzle 3 of 15</span>
            <span style={{ color: 'var(--accent)' }}>20%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: '20%', background: 'var(--accent)' }} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2.5 py-1 text-[10px] font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {MOCK_PUZZLE.theme}
          </span>
          <span className="rounded-md px-2.5 py-1 text-[10px] font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            Rating {MOCK_PUZZLE.difficulty}
          </span>
          <span className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-medium" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <AlertTriangle size={10} /> Targeting: Tactics
          </span>
        </div>

        {/* Board */}
        <div className="card mx-auto w-full max-w-sm p-2">
          <Board fen={MOCK_PUZZLE.fen} orientation="white" movable />
        </div>

        <p className="text-center text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Find the best move for White
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-2">
          <button className="card flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors duration-150" style={{ color: 'var(--text-secondary)' }}>
            <Lightbulb size={13} /> Hint
          </button>
          <button className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150" style={{ background: 'var(--accent)' }}>
            <Sparkles size={13} /> Explain with AI
          </button>
          <button className="card flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors duration-150" style={{ color: 'var(--text-secondary)' }}>
            Skip <SkipForward size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
