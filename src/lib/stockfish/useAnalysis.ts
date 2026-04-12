'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { StockfishManager } from './manager'
import { saveAnalysis } from '@/lib/analysis/persist'
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
      const worker = new Worker(
        new URL('@/workers/stockfish.worker.ts', import.meta.url),
        { type: 'module' },
      )
      managerRef.current = new StockfishManager(worker)
    }
    return managerRef.current
  }

  const analyzeGame = useCallback(
    async (game: GameToAnalyze): Promise<boolean> => {
      const manager = getOrCreateManager()

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }))

      try {
        const moves = await manager.analyzeGame(
          game.pgn,
          (progress) => {
            if (cancelledRef.current) return
            setState((prev) => ({
              ...prev,
              progress: {
                ...progress,
                currentGameId: game.id,
              },
            }))
          },
        )

        if (cancelledRef.current) return false

        await saveAnalysis(game.id, moves)
        return true
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Analysis failed'
        setState((prev) => ({
          ...prev,
          error: message,
        }))
        return false
      }
    },
    [],
  )

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
    isAnalyzing: state.isAnalyzing,
    progress: state.progress,
    error: state.error,
  } as const
}
