-- Video catalog for GothamChess (and future channels) recommendations
CREATE TABLE video_catalog (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id      text NOT NULL UNIQUE,
  title           text NOT NULL,
  description     text NOT NULL DEFAULT '',
  thumbnail_url   text NOT NULL DEFAULT '',
  channel_name    text NOT NULL DEFAULT 'GothamChess',
  published_at    timestamptz NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  categories      text[] NOT NULL DEFAULT '{}',
  tags            text[] NOT NULL DEFAULT '{}',
  view_count      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_catalog_categories ON video_catalog USING gin (categories);
CREATE INDEX idx_video_catalog_published ON video_catalog (published_at DESC);

-- No RLS needed — videos are public content
ALTER TABLE video_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads videos" ON video_catalog FOR SELECT USING (true);
CREATE POLICY "service inserts videos" ON video_catalog FOR INSERT WITH CHECK (true);
CREATE POLICY "service updates videos" ON video_catalog FOR UPDATE USING (true);
