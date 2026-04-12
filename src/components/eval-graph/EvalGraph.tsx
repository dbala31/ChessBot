'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { MoveClassification } from '@/types'

interface EvalPoint {
  readonly ply: number
  readonly eval: number
  readonly classification?: MoveClassification
}

interface EvalGraphProps {
  readonly data: readonly EvalPoint[]
  readonly currentPly?: number
  readonly onClickPly?: (ply: number) => void
}

function clampEval(cp: number): number {
  return Math.max(-500, Math.min(500, cp)) / 100
}

export function EvalGraph({ data, currentPly, onClickPly }: EvalGraphProps) {
  const chartData = data.map((point) => ({
    ply: point.ply,
    eval: clampEval(point.eval),
    isError:
      point.classification === MoveClassification.Mistake ||
      point.classification === MoveClassification.Blunder,
  }))

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          onClick={(e: unknown) => {
            const event = e as { activePayload?: Array<{ payload: { ply: number } }> }
            if (event?.activePayload?.[0]) {
              onClickPly?.(event.activePayload[0].payload.ply)
            }
          }}
        >
          <defs>
            <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9fafb" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#f9fafb" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#1f2937" stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <XAxis dataKey="ply" hide />
          <YAxis domain={[-5, 5]} hide />
          <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="3 3" />
          {currentPly !== undefined && (
            <ReferenceLine x={currentPly} stroke="#22c55e" strokeWidth={2} />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value: unknown) => {
              const v = Number(value)
              return [`${v >= 0 ? '+' : ''}${v.toFixed(1)}`, 'Eval']
            }}
            labelFormatter={(label: unknown) => `Move ${Math.ceil(Number(label) / 2)}`}
          />
          <Area
            type="monotone"
            dataKey="eval"
            stroke="#9ca3af"
            fill="url(#evalGradient)"
            strokeWidth={1.5}
            dot={(props: unknown) => {
              const p = props as {
                cx?: number
                cy?: number
                payload?: { isError: boolean; ply: number }
              }
              if (!p.payload?.isError) return <circle key={p.payload?.ply ?? 0} r={0} />
              return (
                <circle
                  key={p.payload.ply}
                  cx={p.cx}
                  cy={p.cy}
                  r={3}
                  fill="#ef4444"
                  stroke="#ef4444"
                />
              )
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
