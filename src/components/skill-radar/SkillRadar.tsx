'use client'

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { ScoreType } from '@/types'

interface SkillScore {
  readonly scoreType: ScoreType
  readonly value: number
}

interface SkillRadarProps {
  readonly scores: readonly SkillScore[]
}

const SCORE_LABELS: Record<ScoreType, string> = {
  [ScoreType.Tactics]: 'Tactics',
  [ScoreType.Endgame]: 'Endgame',
  [ScoreType.AdvantageCapitalization]: 'Advantage',
  [ScoreType.Resourcefulness]: 'Resourcefulness',
  [ScoreType.TimeManagement]: 'Time Mgmt',
  [ScoreType.OpeningPerformance]: 'Openings',
}

function getScoreColor(value: number): string {
  if (value < 40) return '#ef4444' // red
  if (value < 70) return '#eab308' // yellow
  return '#22c55e' // green
}

export function SkillRadar({ scores }: SkillRadarProps) {
  const data = Object.values(ScoreType).map((type) => {
    const score = scores.find((s) => s.scoreType === type)
    return {
      skill: SCORE_LABELS[type],
      value: score?.value ?? 0,
      fullMark: 100,
    }
  })

  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.value, 0) / scores.length) : 0

  const fillColor = getScoreColor(avgScore)

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Radar
            name="Skill"
            dataKey="value"
            stroke={fillColor}
            fill={fillColor}
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#f9fafb' }}
            itemStyle={{ color: '#d1d5db' }}
            formatter={(value: unknown) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
