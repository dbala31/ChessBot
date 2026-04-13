'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SkillRadar } from '@/components/skill-radar/SkillRadar'
import { ScoreType } from '@/types'
import type { GameSource } from '@/types'
import { Upload, Loader2, Check, Crown, ArrowRight, Sparkles } from 'lucide-react'

type Step = 'welcome' | 'usernames' | 'importing' | 'analyzing' | 'reveal'

const MOCK_SCORES = [
  { scoreType: ScoreType.Tactics, value: 62 },
  { scoreType: ScoreType.Endgame, value: 45 },
  { scoreType: ScoreType.AdvantageCapitalization, value: 71 },
  { scoreType: ScoreType.Resourcefulness, value: 38 },
  { scoreType: ScoreType.TimeManagement, value: 55 },
  { scoreType: ScoreType.OpeningPerformance, value: 68 },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [chesscomUsername, setChesscomUsername] = useState('')
  const [lichessUsername, setLichessUsername] = useState('')
  const [importProgress, setImportProgress] = useState<Record<GameSource, { done: boolean; count: number }>>({
    chesscom: { done: false, count: 0 },
    lichess: { done: false, count: 0 },
  })
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [scores, setScores] = useState(MOCK_SCORES)

  const hasUsername = chesscomUsername.trim() || lichessUsername.trim()

  const handleImport = useCallback(async () => {
    setStep('importing')
    const sources: { source: GameSource; username: string }[] = []
    if (chesscomUsername.trim()) sources.push({ source: 'chesscom', username: chesscomUsername.trim() })
    if (lichessUsername.trim()) sources.push({ source: 'lichess', username: lichessUsername.trim() })

    for (const { source, username } of sources) {
      try {
        const res = await fetch('/api/games/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, source, limit: 200 }),
        })
        const data = await res.json()
        setImportProgress((prev) => ({
          ...prev,
          [source]: { done: true, count: data.data?.imported ?? 0 },
        }))
      } catch {
        setImportProgress((prev) => ({
          ...prev,
          [source]: { done: true, count: 0 },
        }))
      }
    }

    // Move to analysis step
    setStep('analyzing')
    // Simulate analysis progress (in production this would use useAnalysis hook)
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 120))
      setAnalyzeProgress(i)
    }
    setStep('reveal')
  }, [chesscomUsername, lichessUsername])

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {(['welcome', 'usernames', 'importing', 'analyzing', 'reveal'] as const).map((s, i) => (
            <div
              key={s}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: step === s ? 32 : 12,
                background:
                  ['welcome', 'usernames', 'importing', 'analyzing', 'reveal'].indexOf(step) >= i
                    ? 'var(--accent)'
                    : 'var(--border)',
              }}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <div className="text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Crown size={32} />
            </div>
            <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Welcome to ChessBot
            </h1>
            <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              Your personal chess coach. We&apos;ll analyze your games, find your weaknesses, and build
              a training plan just for you.
            </p>
            <button
              onClick={() => setStep('usernames')}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors duration-150 mx-auto"
              style={{ background: 'var(--accent)' }}
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Enter usernames */}
        {step === 'usernames' && (
          <div>
            <h2 className="mb-1 text-center text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Connect your accounts
            </h2>
            <p className="mb-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Enter at least one username to import your games
            </p>

            <div className="space-y-4">
              <div className="card p-4">
                <label className="mb-2 block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Chess.com
                </label>
                <input
                  type="text"
                  value={chesscomUsername}
                  onChange={(e) => setChesscomUsername(e.target.value)}
                  placeholder="Your Chess.com username"
                  className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="card p-4">
                <label className="mb-2 block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Lichess
                </label>
                <input
                  type="text"
                  value={lichessUsername}
                  onChange={(e) => setLichessUsername(e.target.value)}
                  placeholder="Your Lichess username"
                  className="w-full rounded-md px-3 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-2"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={!hasUsername}
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              <Upload size={16} />
              Import Games
            </button>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === 'importing' && (
          <div className="text-center">
            <Loader2
              size={40}
              className="mx-auto mb-4 animate-spin"
              style={{ color: 'var(--accent)' }}
            />
            <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Importing your games...
            </h2>
            <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              Fetching games from your connected accounts
            </p>
            <div className="space-y-2">
              {chesscomUsername.trim() && (
                <div className="card flex items-center gap-3 px-4 py-3">
                  {importProgress.chesscom.done ? (
                    <Check size={16} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  )}
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Chess.com
                    {importProgress.chesscom.done && ` — ${importProgress.chesscom.count} games`}
                  </span>
                </div>
              )}
              {lichessUsername.trim() && (
                <div className="card flex items-center gap-3 px-4 py-3">
                  {importProgress.lichess.done ? (
                    <Check size={16} style={{ color: 'var(--success)' }} />
                  ) : (
                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  )}
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Lichess
                    {importProgress.lichess.done && ` — ${importProgress.lichess.count} games`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Analyzing */}
        {step === 'analyzing' && (
          <div className="text-center">
            <Sparkles
              size={40}
              className="mx-auto mb-4"
              style={{ color: 'var(--accent)' }}
            />
            <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Analyzing your games...
            </h2>
            <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              Running Stockfish analysis on every move. This may take a few minutes.
            </p>
            <div className="mx-auto max-w-xs">
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ background: 'var(--border)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${analyzeProgress}%`, background: 'var(--accent)' }}
                />
              </div>
              <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {analyzeProgress}% complete
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Skill reveal */}
        {step === 'reveal' && (
          <div className="text-center">
            <h2 className="mb-1 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Your Skill Profile
            </h2>
            <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              Here&apos;s how you perform across six key areas
            </p>

            <div className="card mb-6 p-4">
              <SkillRadar scores={scores} />
            </div>

            {(() => {
              const weakest = [...scores].sort((a, b) => a.value - b.value)[0]
              const LABELS: Record<string, string> = {
                [ScoreType.Tactics]: 'Tactics',
                [ScoreType.Endgame]: 'Endgame',
                [ScoreType.AdvantageCapitalization]: 'Advantage Capitalization',
                [ScoreType.Resourcefulness]: 'Resourcefulness',
                [ScoreType.TimeManagement]: 'Time Management',
                [ScoreType.OpeningPerformance]: 'Opening Performance',
              }
              return (
                <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Your weakest area is{' '}
                  <span className="font-semibold" style={{ color: 'var(--danger)' }}>
                    {LABELS[weakest.scoreType]} ({weakest.value}/100)
                  </span>
                  . We&apos;ll focus your training here first.
                </p>
              )
            })()}

            <button
              onClick={() => router.push('/train')}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors duration-150"
              style={{ background: 'var(--accent)' }}
            >
              Start Training <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
