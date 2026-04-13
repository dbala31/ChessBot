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

export function SkillRadar({ scores }: SkillRadarProps) {
  const data = Object.values(ScoreType).map((type) => {
    const score = scores.find((s) => s.scoreType === type)
    return {
      skill: SCORE_LABELS[type],
      value: score?.value ?? 0,
      fullMark: 100,
    }
  })

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Radar
            name="Skill"
            dataKey="value"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.12}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#0f172a', fontWeight: 600 }}
            itemStyle={{ color: '#7c3aed' }}
            formatter={(value: unknown) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
