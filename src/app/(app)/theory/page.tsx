'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Swords, Crown, Lightbulb } from 'lucide-react'
import { THEORY_TOPICS, CATEGORY_LABELS, type TheoryCategory } from '@/lib/theory/content'

const CATEGORY_ICONS: Record<TheoryCategory, typeof BookOpen> = {
  openings: BookOpen,
  endgames: Crown,
  tactics: Swords,
  strategy: Lightbulb,
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'var(--success-light)', text: 'var(--success)' },
  intermediate: { bg: 'var(--warning-light)', text: 'var(--warning)' },
  advanced: { bg: 'var(--danger-light)', text: 'var(--danger)' },
}

export default function TheoryPage() {
  const [activeCategory, setActiveCategory] = useState<TheoryCategory | 'all'>('all')

  const filtered =
    activeCategory === 'all'
      ? THEORY_TOPICS
      : THEORY_TOPICS.filter((t) => t.category === activeCategory)

  const categories: Array<TheoryCategory | 'all'> = [
    'all',
    'openings',
    'endgames',
    'tactics',
    'strategy',
  ]

  return (
    <div className="mx-auto max-w-4xl p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Chess Theory
        </h1>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Learn openings, endgames, tactics, and strategy fundamentals
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150"
              style={
                active
                  ? {
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      border: '1px solid var(--accent)',
                    }
                  : {
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }
              }
            >
              {cat !== 'all' &&
                (() => {
                  const Icon = CATEGORY_ICONS[cat]
                  return <Icon size={12} />
                })()}
              {cat === 'all' ? 'All Topics' : CATEGORY_LABELS[cat]}
            </button>
          )
        })}
      </div>

      {/* Topic grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((topic) => {
          const Icon = CATEGORY_ICONS[topic.category]
          const diff = DIFFICULTY_COLORS[topic.difficulty]

          return (
            <Link
              key={topic.id}
              href={`/theory/${topic.id}`}
              className="card group cursor-pointer p-5 transition-all duration-150"
            >
              <div className="mb-3 flex items-center justify-between">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  <Icon size={16} />
                </div>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: diff.bg, color: diff.text }}
                >
                  {topic.difficulty}
                </span>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {topic.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {topic.description}
              </p>
              <div className="mt-3">
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
                >
                  {CATEGORY_LABELS[topic.category]}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
