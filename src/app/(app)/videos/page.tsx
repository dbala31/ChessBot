'use client'

import { useState, useEffect } from 'react'
import { Play, Loader2, RefreshCw, X, ExternalLink, Eye, Clock } from 'lucide-react'
import Link from 'next/link'

interface VideoItem {
  readonly youtubeId: string
  readonly title: string
  readonly thumbnailUrl: string
  readonly channelName: string
  readonly publishedAt: string
  readonly durationSeconds: number
  readonly categories: readonly string[]
  readonly viewCount: number
  readonly reason: string
}

const CATEGORY_LABELS: Record<string, string> = {
  openings: 'Openings',
  endgames: 'Endgames',
  tactics: 'Tactics',
  strategy: 'Strategy',
  game_analysis: 'Game Analysis',
  general: 'General',
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`
  return String(count)
}

export default function VideosPage() {
  const [videos, setVideos] = useState<readonly VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/videos')
        const data = await res.json()
        if (data.success) setVideos(data.data)
      } catch { /* empty */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/videos/sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        // Reload recommendations
        const reloadRes = await fetch('/api/videos')
        const reloadData = await reloadRes.json()
        if (reloadData.success) setVideos(reloadData.data)
      }
    } catch { /* empty */ }
    finally { setSyncing(false) }
  }

  const filtered = categoryFilter === 'all'
    ? videos
    : videos.filter((v) => v.categories.includes(categoryFilter))

  // Split into "For You" (with reasons tied to scores) and "Browse"
  const forYou = videos.filter((v) => v.reason.startsWith('Recommended for'))
  const browse = filtered

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-4 lg:p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Videos</h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            GothamChess videos recommended based on your skill profile
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Videos'}
        </button>
      </div>

      {videos.length === 0 && (
        <div className="py-20 text-center">
          <Play size={48} style={{ color: 'var(--text-muted)' }} />
          <h2 className="mt-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            No videos yet
          </h2>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Click "Sync Videos" to fetch GothamChess content, or add your YouTube API key to .env.local.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="mt-4 cursor-pointer rounded-md px-4 py-2 text-xs font-medium text-white"
            style={{ background: 'var(--accent)' }}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Video player modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setActiveVideo(null)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button onClick={() => setActiveVideo(null)} className="cursor-pointer rounded-full p-1 text-white transition-colors duration-150 hover:bg-white/20">
                <X size={20} />
              </button>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* For You section */}
      {forYou.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            For You
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forYou.slice(0, 6).map((video) => (
              <VideoCard key={video.youtubeId} video={video} onPlay={setActiveVideo} />
            ))}
          </div>
        </div>
      )}

      {/* Browse section */}
      {videos.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Browse All
            </h2>
          </div>

          {/* Category filter */}
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', 'openings', 'endgames', 'tactics', 'strategy', 'game_analysis'].map((cat) => {
              const active = categoryFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={active
                    ? { background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent)' }
                    : { background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
                  }
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
                </button>
              )
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {browse.map((video) => (
              <VideoCard key={video.youtubeId} video={video} onPlay={setActiveVideo} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function VideoCard({ video, onPlay }: { video: VideoItem; onPlay: (id: string) => void }) {
  return (
    <div className="card group cursor-pointer overflow-hidden transition-all duration-150" onClick={() => onPlay(video.youtubeId)}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
            <Play size={20} fill="var(--accent)" style={{ color: 'var(--accent)' }} />
          </div>
        </div>
        {video.durationSeconds > 0 && (
          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(video.durationSeconds)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {video.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>{video.channelName}</span>
          {video.viewCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Eye size={9} /> {formatViews(video.viewCount)}
              </span>
            </>
          )}
          <span>·</span>
          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
        </div>

        {/* Categories */}
        <div className="mt-2 flex flex-wrap gap-1">
          {video.categories.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
        </div>

        {/* Reason */}
        {video.reason.startsWith('Recommended') && (
          <p className="mt-2 text-[10px] italic" style={{ color: 'var(--warning)' }}>
            {video.reason}
          </p>
        )}
      </div>
    </div>
  )
}
