'use client'

interface EvalBarProps {
  readonly eval: number
  readonly isMate?: boolean
  readonly mateIn?: number | null
}

function evalToPercentage(cp: number): number {
  const clamped = Math.max(-500, Math.min(500, cp))
  return 50 + (clamped / 500) * 45
}

function formatEval(cp: number, isMate: boolean, mateIn: number | null): string {
  if (isMate && mateIn !== null) return `M${Math.abs(mateIn)}`
  const pawns = Math.abs(cp / 100)
  const sign = cp >= 0 ? '+' : '-'
  return `${sign}${pawns.toFixed(1)}`
}

export function EvalBar({ eval: evaluation, isMate = false, mateIn = null }: EvalBarProps) {
  const whitePercent = isMate
    ? mateIn !== null && mateIn > 0 ? 95 : 5
    : evalToPercentage(evaluation)

  return (
    <div
      className="flex h-full w-7 flex-col overflow-hidden rounded-lg"
      style={{ border: '1px solid var(--border)' }}
    >
      <div
        className="transition-all duration-500 ease-out"
        style={{ height: `${100 - whitePercent}%`, background: 'var(--bg-tertiary)' }}
      />
      <div
        className="relative transition-all duration-500 ease-out"
        style={{ height: `${whitePercent}%`, background: 'var(--text-primary)' }}
      >
        <span
          className="absolute inset-x-0 text-center text-[9px] font-bold leading-tight"
          style={{
            color: 'var(--bg-primary)',
            ...(whitePercent > 50 ? { top: '3px' } : { bottom: '3px' }),
          }}
        >
          {formatEval(evaluation, isMate, mateIn)}
        </span>
      </div>
    </div>
  )
}
