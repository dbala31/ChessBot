'use client'

import { useState, useEffect, useCallback } from 'react'
import { DrillCard } from '@/components/drill-card/DrillCard'
import { Lightbulb, Sparkles, SkipForward, AlertTriangle, Loader2, Trophy, Target, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { GamePhase } from '@/types'
import { getUserId } from '@/lib/auth/user'

interface DrillItem {
  readonly id: string
  readonly fen: string
  readonly solutionPv: string
  readonly lessonType: string
  readonly difficulty: number
  readonly themeTags: readonly string[]
}

type SessionState = 'loading' | 'empty' | 'drilling' | 'summary'

interface DrillResult {
  readonly puzzleId: string
  readonly correct: boolean
  readonly timeMs: number
}

const LESSON_LABELS: Record<string, string> = {
  retry_mistakes: 'Retry Mistakes',
  blunder_preventer: 'Blunder Prevention',
  advantage_capitalization: 'Advantage',
  opening_improver: 'Openings',
  endgame_drill: 'Endgame',
  defender: 'Defense',
  tactics: 'Tactics',
  checkmate_patterns: 'Checkmate',
  intuition_trainer: 'Intuition',
  '360_trainer': '360 Trainer',
  blindfold_tactics: 'Blindfold',
}

export default function TrainPage() {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [drills, setDrills] = useState<readonly DrillItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<readonly DrillResult[]>([])
  const [drillKey, setDrillKey] = useState(0) // force re-mount DrillCard

  useEffect(() => {
    async function loadQueue() {
      try {
        const res = await fetch('/api/drills/queue')
        const data = await res.json()
        if (data.success && data.data.length > 0) {
          setDrills(data.data)
          setSessionState('drilling')
        } else {
          setSessionState('empty')
        }
      } catch {
        setSessionState('empty')
      }
    }
    loadQueue()
  }, [])

  const handleResult = useCallback(async (correct: boolean, timeMs: number) => {
    const drill = drills[currentIndex]
    if (!drill) return

    const result: DrillResult = { puzzleId: drill.id, correct, timeMs }
    setResults((prev) => [...prev, result])

    // Record attempt
    try {
      await fetch('/api/drills/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: getUserId(),
          puzzleId: drill.id,
          correct,
          timeTakenMs: timeMs,
        }),
      })
    } catch {
      // non-critical
    }

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex + 1 >= drills.length) {
        setSessionState('summary')
      } else {
        setCurrentIndex((i) => i + 1)
        setDrillKey((k) => k + 1)
      }
    }, correct ? 1200 : 2500)
  }, [drills, currentIndex])

  const handleSkip = useCallback(() => {
    const drill = drills[currentIndex]
    if (!drill) return

    setResults((prev) => [...prev, { puzzleId: drill.id, correct: false, timeMs: 0 }])

    if (currentIndex + 1 >= drills.length) {
      setSessionState('summary')
    } else {
      setCurrentIndex((i) => i + 1)
      setDrillKey((k) => k + 1)
    }
  }, [drills, currentIndex])

  // Loading state
  if (sessionState === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
        <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>Loading drills...</span>
      </div>
    )
  }

  // Empty state
  if (sessionState === 'empty') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <Target size={48} style={{ color: 'var(--text-muted)' }} />
        <h2 className="mt-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          No drills available
        </h2>
        <p className="mt-2 max-w-sm text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Import games and run Stockfish analysis to generate drills from your mistakes.
        </p>
        <Link
          href="/settings"
          className="mt-4 flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Go to Settings <ArrowRight size={12} />
        </Link>
      </div>
    )
  }

  // Summary state
  if (sessionState === 'summary') {
    const correct = results.filter((r) => r.correct).length
    const total = results.length
    const avgTime = total > 0 ? Math.round(results.reduce((sum, r) => sum + r.timeMs, 0) / total / 1000) : 0
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0

    return (
      <div className="flex h-full flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="card p-6 text-center">
            <Trophy size={40} className="mx-auto" style={{ color: percentage >= 70 ? 'var(--success)' : 'var(--warning)' }} />
            <h2 className="mt-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Training Complete
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{correct}/{total}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{percentage}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{avgTime}s</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Avg Time</p>
              </div>
            </div>

            {/* Per-drill results */}
            <div className="mt-4 space-y-1">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1 text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Puzzle {i + 1}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{(r.timeMs / 1000).toFixed(1)}s</span>
                    {r.correct ? (
                      <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle size={14} style={{ color: 'var(--danger)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href="/dashboard"
                className="flex-1 rounded-md px-4 py-2.5 text-center text-xs font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 cursor-pointer rounded-md px-4 py-2.5 text-xs font-medium text-white"
                style={{ background: 'var(--accent)' }}
              >
                Train Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Drilling state
  const currentDrill = drills[currentIndex]
  const correctSoFar = results.filter((r) => r.correct).length
  const progressPercent = Math.round(((currentIndex) / drills.length) * 100)

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
              {drills.length} puzzles targeting your weaknesses
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{correctSoFar}/{results.length}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>correct</p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="mb-1.5 flex justify-between text-[11px]">
            <span style={{ color: 'var(--text-muted)' }}>Puzzle {currentIndex + 1} of {drills.length}</span>
            <span style={{ color: 'var(--accent)' }}>{progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2.5 py-1 text-[10px] font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {LESSON_LABELS[currentDrill.lessonType] ?? currentDrill.lessonType}
          </span>
          <span className="rounded-md px-2.5 py-1 text-[10px] font-medium" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            Rating {Math.round(currentDrill.difficulty)}
          </span>
        </div>

        {/* Board */}
        <div className="mx-auto w-full max-w-sm">
          <DrillCard
            key={drillKey}
            fen={currentDrill.fen}
            solutionPv={currentDrill.solutionPv}
            onResult={handleResult}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-2">
          <button
            onClick={handleSkip}
            className="card flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors duration-150"
            style={{ color: 'var(--text-secondary)' }}
          >
            Skip <SkipForward size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
