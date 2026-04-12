'use client'

import { Board } from '@/components/board/Board'

// Mock puzzle data for design
const MOCK_PUZZLE = {
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  theme: 'Scholar\'s Mate',
  difficulty: 1200,
}

export default function TrainPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Daily Training</h2>
          <span className="text-sm text-gray-400">Puzzle 3 of 15</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: '20%' }}
          />
        </div>

        {/* Puzzle info */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Theme: {MOCK_PUZZLE.theme}</span>
          <span>Rating: {MOCK_PUZZLE.difficulty}</span>
          <span className="rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs text-yellow-400">
            Your weakest: Tactics
          </span>
        </div>

        {/* Board */}
        <div className="mx-auto w-full max-w-md">
          <Board fen={MOCK_PUZZLE.fen} orientation="white" movable />
        </div>

        <p className="text-center text-sm text-gray-400">
          Find the best move for White
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Show Hint
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            🤖 Explain with AI
          </button>
          <button className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
            Skip →
          </button>
        </div>
      </div>
    </div>
  )
}
