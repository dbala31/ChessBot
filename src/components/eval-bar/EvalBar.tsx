'use client'

interface EvalBarProps {
  /** Evaluation in centipawns (positive = white advantage) */
  readonly eval: number
  /** Whether it's a mate score */
  readonly isMate?: boolean
  /** Moves until mate (if isMate is true) */
  readonly mateIn?: number | null
}

function evalToPercentage(cp: number): number {
  // Sigmoid-like mapping: ±500cp → ~5% / ~95%
  const clamped = Math.max(-500, Math.min(500, cp))
  return 50 + (clamped / 500) * 45
}

function formatEval(cp: number, isMate: boolean, mateIn: number | null): string {
  if (isMate && mateIn !== null) {
    return `M${Math.abs(mateIn)}`
  }
  const pawns = Math.abs(cp / 100)
  const sign = cp >= 0 ? '+' : '-'
  return `${sign}${pawns.toFixed(1)}`
}

export function EvalBar({
  eval: evaluation,
  isMate = false,
  mateIn = null,
}: EvalBarProps) {
  const whitePercent = isMate
    ? mateIn !== null && mateIn > 0
      ? 95
      : 5
    : evalToPercentage(evaluation)

  return (
    <div className="flex h-full w-8 flex-col overflow-hidden rounded-md border border-gray-700">
      {/* Black side (top) */}
      <div
        className="bg-gray-800 transition-all duration-500 ease-out"
        style={{ height: `${100 - whitePercent}%` }}
      />
      {/* White side (bottom) */}
      <div
        className="relative bg-gray-100 transition-all duration-500 ease-out"
        style={{ height: `${whitePercent}%` }}
      >
        <span
          className={`absolute inset-x-0 text-center text-[10px] font-bold leading-tight ${
            whitePercent > 50
              ? 'top-1 text-gray-800'
              : 'bottom-1 text-gray-800'
          }`}
        >
          {formatEval(evaluation, isMate, mateIn)}
        </span>
      </div>
    </div>
  )
}
