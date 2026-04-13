'use client'

import { useState } from 'react'
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react'
import { useAnalysis } from '@/lib/stockfish/useAnalysis'

export function AnalysisSection() {
  const { analyzeBatch, isAnalyzing, progress, error: analysisError, cancel } = useAnalysis()
  const [analysisResult, setAnalysisResult] = useState<{ completed: number; total: number } | null>(
    null,
  )
  const [computingSkills, setComputingSkills] = useState(false)

  async function handleAnalyzeAll() {
    setAnalysisResult(null)

    const res = await fetch('/api/analysis/unanalyzed')
    const data = await res.json()

    if (!data.success || !data.data.length) {
      setAnalysisResult({ completed: 0, total: 0 })
      return
    }

    const games = data.data as Array<{ id: string; pgn: string }>
    const completed = await analyzeBatch(games)

    setAnalysisResult({ completed, total: games.length })

    if (completed > 0) {
      setComputingSkills(true)
      try {
        await fetch('/api/skills/compute', { method: 'POST' })
      } catch {
        // non-critical
      } finally {
        setComputingSkills(false)
      }
    }
  }

  return (
    <div className="card p-5">
      <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Analysis
      </h2>
      <p className="mb-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        Run Stockfish on all unanalyzed games
      </p>

      {isAnalyzing && progress && (
        <div className="mb-3">
          <div
            className="mb-1.5 flex justify-between text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>
              Game {progress.currentGame} of {progress.totalGames}
            </span>
            <span>
              Move {progress.currentPly} / {progress.totalPlies}
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width:
                  progress.totalPlies > 0
                    ? `${Math.round((progress.currentPly / progress.totalPlies) * 100)}%`
                    : '0%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {computingSkills && (
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--accent)' }}>
          <Loader2 size={12} className="animate-spin" />
          Computing skill scores...
        </div>
      )}

      {analysisResult && !isAnalyzing && (
        <div className="mb-3 flex items-center gap-2 text-xs" style={{ color: 'var(--success)' }}>
          <CheckCircle2 size={13} />
          {analysisResult.total === 0
            ? 'All games already analyzed!'
            : `Analyzed ${analysisResult.completed} of ${analysisResult.total} games`}
        </div>
      )}

      {analysisError && (
        <p className="mb-3 text-xs" style={{ color: 'var(--danger)' }}>
          {analysisError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleAnalyzeAll}
          disabled={isAnalyzing}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium text-white transition-colors duration-150 disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {isAnalyzing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <FlaskConical size={13} />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Analyze All Games'}
        </button>
        {isAnalyzing && (
          <button
            onClick={cancel}
            className="flex cursor-pointer items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors duration-150"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
