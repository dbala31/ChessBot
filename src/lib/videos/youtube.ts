import { createServiceClient } from '@/lib/supabase/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? ''
const GOTHAMCHESS_CHANNEL_ID = 'UCQHX6ViZmPsWiYSFAyS0a3Q'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

interface YouTubeSearchItem {
  readonly id: { videoId: string }
  readonly snippet: {
    title: string
    description: string
    publishedAt: string
    thumbnails: { medium: { url: string } }
  }
}

interface YouTubeVideoItem {
  readonly id: string
  readonly contentDetails: { duration: string }
  readonly statistics: { viewCount: string }
  readonly snippet: { tags?: string[] }
}

// Chess topic categories based on title/description keywords
const CATEGORY_PATTERNS: Record<string, readonly RegExp[]> = {
  openings: [
    /opening/i,
    /gambit/i,
    /sicilian/i,
    /caro.?kann/i,
    /french defense/i,
    /ruy lopez/i,
    /italian game/i,
    /king'?s indian/i,
    /queen'?s gambit/i,
    /london system/i,
    /english opening/i,
    /dutch defense/i,
    /scandinavian/i,
    /pirc/i,
    /nimzo/i,
    /grünfeld/i,
    /catalan/i,
    /berlin/i,
    /najdorf/i,
    /dragon/i,
    /slav/i,
    /semi-slav/i,
    /petroff/i,
    /scotch/i,
  ],
  endgames: [
    /endgame/i,
    /end game/i,
    /rook ending/i,
    /pawn ending/i,
    /king and pawn/i,
    /bishop ending/i,
    /knight ending/i,
    /opposite.?color/i,
    /lucena/i,
    /philidor/i,
    /tablebase/i,
  ],
  tactics: [
    /tactics/i,
    /puzzle/i,
    /checkmate/i,
    /fork/i,
    /pin/i,
    /skewer/i,
    /discovered/i,
    /sacrifice/i,
    /combination/i,
    /brilliant/i,
    /trick/i,
    /trap/i,
    /blunder/i,
    /mate in/i,
    /zwischenzug/i,
  ],
  strategy: [
    /strategy/i,
    /positional/i,
    /pawn structure/i,
    /middlegame/i,
    /planning/i,
    /improve/i,
    /think like/i,
    /concept/i,
    /principle/i,
    /master class/i,
    /lesson/i,
    /how to/i,
  ],
  game_analysis: [
    /game analysis/i,
    /review/i,
    /breakdown/i,
    /annotated/i,
    /guess the elo/i,
    /subscriber game/i,
    /gotham.?chess/i,
    /magnus/i,
    /hikaru/i,
    /world champion/i,
    /tournament/i,
    /rapid/i,
    /blitz/i,
    /classical/i,
    /candidates/i,
  ],
}

function categorizeVideo(title: string, description: string, tags: readonly string[]): string[] {
  const text = `${title} ${description} ${tags.join(' ')}`
  const categories: string[] = []

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some((p) => p.test(text))) {
      categories.push(category)
    }
  }

  // Default category if nothing matches
  if (categories.length === 0) {
    categories.push('general')
  }

  return categories
}

// Parse ISO 8601 duration (PT1H2M3S) to seconds
function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] ?? '0', 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const seconds = parseInt(match[3] ?? '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

export async function fetchGothamChessVideos(maxResults: number = 50): Promise<number> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY not configured')
  }

  const supabase = createServiceClient()

  // Search for recent videos from GothamChess
  const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`)
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY)
  searchUrl.searchParams.set('channelId', GOTHAMCHESS_CHANNEL_ID)
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('order', 'date')
  searchUrl.searchParams.set('maxResults', String(maxResults))

  const searchRes = await fetch(searchUrl.toString())
  if (!searchRes.ok) {
    const err = await searchRes.json()
    throw new Error(`YouTube API error: ${err.error?.message ?? searchRes.statusText}`)
  }

  const searchData = (await searchRes.json()) as { items: YouTubeSearchItem[] }
  const videoIds = searchData.items.map((item) => item.id.videoId)

  if (videoIds.length === 0) return 0

  // Get video details (duration, view count, tags)
  const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`)
  detailsUrl.searchParams.set('key', YOUTUBE_API_KEY)
  detailsUrl.searchParams.set('id', videoIds.join(','))
  detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet')

  const detailsRes = await fetch(detailsUrl.toString())
  const detailsData = (await detailsRes.json()) as { items: YouTubeVideoItem[] }

  const detailsMap = new Map(detailsData.items.map((v) => [v.id, v]))

  // Upsert videos into catalog
  const rows = searchData.items.map((item) => {
    const details = detailsMap.get(item.id.videoId)
    const tags = details?.snippet?.tags ?? []
    const categories = categorizeVideo(item.snippet.title, item.snippet.description, tags)

    return {
      youtube_id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description.slice(0, 500),
      thumbnail_url: item.snippet.thumbnails.medium.url,
      channel_name: 'GothamChess',
      published_at: item.snippet.publishedAt,
      duration_seconds: details ? parseDuration(details.contentDetails.duration) : 0,
      categories,
      tags: tags.slice(0, 20),
      view_count: details ? parseInt(details.statistics.viewCount ?? '0', 10) : 0,
    }
  })

  const { error } = await supabase.from('video_catalog').upsert(rows, { onConflict: 'youtube_id' })

  if (error) {
    throw new Error(`Failed to save videos: ${error.message}`)
  }

  return rows.length
}

// Map weak skill areas to video categories
const SKILL_TO_VIDEO_CATEGORY: Record<string, string[]> = {
  tactics: ['tactics'],
  endgame: ['endgames'],
  advantage_capitalization: ['strategy', 'game_analysis'],
  resourcefulness: ['strategy', 'tactics'],
  time_management: ['strategy', 'game_analysis'],
  opening_performance: ['openings'],
}

export interface VideoRecommendation {
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

export async function getRecommendedVideos(
  scores: readonly { scoreType: string; value: number }[],
): Promise<readonly VideoRecommendation[]> {
  const supabase = createServiceClient()

  // Fetch all videos
  const { data: videos } = await supabase
    .from('video_catalog')
    .select(
      'youtube_id, title, thumbnail_url, channel_name, published_at, duration_seconds, categories, view_count',
    )
    .order('published_at', { ascending: false })
    .limit(200)

  if (!videos || videos.length === 0) return []

  // Sort scores weakest first
  const sorted = [...scores].sort((a, b) => a.value - b.value)

  const recommendations: VideoRecommendation[] = []
  const usedIds = new Set<string>()

  // For each weak area, find matching videos
  for (const score of sorted) {
    const targetCategories = SKILL_TO_VIDEO_CATEGORY[score.scoreType] ?? []
    if (targetCategories.length === 0) continue

    const matching = (
      videos as Array<{
        youtube_id: string
        title: string
        thumbnail_url: string
        channel_name: string
        published_at: string
        duration_seconds: number
        categories: string[]
        view_count: number
      }>
    ).filter(
      (v) =>
        !usedIds.has(v.youtube_id) &&
        v.categories.some((c: string) => targetCategories.includes(c)),
    )

    // Pick top 3 by view count for this category
    const topMatches = matching.sort((a, b) => b.view_count - a.view_count).slice(0, 3)

    const skillLabel = score.scoreType.replace(/_/g, ' ')
    for (const video of topMatches) {
      usedIds.add(video.youtube_id)
      recommendations.push({
        youtubeId: video.youtube_id,
        title: video.title,
        thumbnailUrl: video.thumbnail_url,
        channelName: video.channel_name,
        publishedAt: video.published_at,
        durationSeconds: video.duration_seconds,
        categories: video.categories,
        viewCount: video.view_count,
        reason: `Recommended for your ${skillLabel} (score: ${Math.round(score.value)}/100)`,
      })
    }
  }

  // Fill remaining with popular videos
  const remaining = (
    videos as Array<{
      youtube_id: string
      title: string
      thumbnail_url: string
      channel_name: string
      published_at: string
      duration_seconds: number
      categories: string[]
      view_count: number
    }>
  )
    .filter((v) => !usedIds.has(v.youtube_id))
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, Math.max(0, 12 - recommendations.length))

  for (const video of remaining) {
    recommendations.push({
      youtubeId: video.youtube_id,
      title: video.title,
      thumbnailUrl: video.thumbnail_url,
      channelName: video.channel_name,
      publishedAt: video.published_at,
      durationSeconds: video.duration_seconds,
      categories: video.categories,
      viewCount: video.view_count,
      reason: 'Popular on GothamChess',
    })
  }

  return recommendations
}
