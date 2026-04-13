'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { StockfishManager } from './manager'
import { saveCheckpoint, clearCheckpoint, getIncompleteGames } from './analysisStore'
import type { AnalysisProgress } from '@/types'

interface AnalysisState {
  readonly isAnalyzing: boolean
  readonly progress: AnalysisProgress | null
  readonly error: string | null
}

interface GameToAnalyze {
  readonly id: string
  readonly pgn: string
}

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: null,
    error: null,
  })

  const managerRef = useRef<StockfishManager | null>(null)
  const cancelledRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current?.destroy()
      managerRef.current = null
    }
  }, [])

  function getOrCreateManager(): StockfishManager {
    if (!managerRef.current) {
      const worker = new Worker(new URL('@/workers/stockfish.worker.ts', import.meta.url), {
        type: 'module',
      })
      managerRef.current = new StockfishManager(worker)
    }
    return managerRef.current
  }

  const analyzeGame = useCallback(async (game: GameToAnalyze): Promise<boolean> => {
    const manager = getOrCreateManager()

    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      error: null,
    }))

    try {
      const moves = await manager.analyzeGame(game.pgn, (progress) => {
        if (cancelledRef.current) return
        const updated = { ...progress, currentGameId: game.id }
        setState((prev) => ({ ...prev, progress: updated }))

        // Persist checkpoint so analysis can resume after tab close
        saveCheckpoint({
          gameId: game.id,
          completedPlies: progress.currentPly,
          totalPlies: progress.totalPlies,
          timestamp: Date.now(),
        }).catch(() => {})
      })

      if (cancelledRef.current) return false

      // Save via API route (server-side persist + drill generation)
      const res = await fetch('/api/analysis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, moves }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save analysis')
      }
      await clearCheckpoint(game.id)
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed'
      // Destroy the dead worker so next game gets a fresh one
      managerRef.current?.destroy()
      managerRef.current = null
      setState((prev) => ({
        ...prev,
        error: message,
      }))
      return false
    }
  }, [])

  const analyzeBatch = useCallback(
    async (games: readonly GameToAnalyze[]): Promise<number> => {
      cancelledRef.current = false
      let completed = 0

      for (let i = 0; i < games.length; i++) {
        if (cancelledRef.current) break

        setState((prev) => ({
          ...prev,
          progress: {
            currentGame: i + 1,
            totalGames: games.length,
            currentGameId: games[i].id,
            currentPly: 0,
            totalPlies: 0,
          },
        }))

        const success = await analyzeGame(games[i])
        if (success) completed++
      }

      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
      }))

      return completed
    },
    [analyzeGame],
  )

  const cancel = useCallback(() => {
    cancelledRef.current = true
    managerRef.current?.stop()
    setState((prev) => ({
      ...prev,
      isAnalyzing: false,
    }))
  }, [])

  return {
    analyzeGame,
    analyzeBatch,
    cancel,
    getIncompleteGames,
    isAnalyzing: state.isAnalyzing,
    progress: state.progress,
    error: state.error,
  } as const
}
