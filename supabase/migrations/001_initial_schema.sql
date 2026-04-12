-- ChessBot initial schema
-- Phase 0 / Task 0.4

-- ── Enums ──────────────────────────────────────────────────────────────────────

create type game_source as enum ('chesscom', 'lichess');
create type move_classification as enum ('best', 'good', 'inaccuracy', 'mistake', 'blunder');
create type game_phase as enum ('opening', 'middlegame', 'endgame');
create type score_type as enum (
  'tactics',
  'endgame',
  'advantage_capitalization',
  'resourcefulness',
  'time_management',
  'opening_performance'
);
create type lesson_type as enum (
  'retry_mistakes',
  'blunder_preventer',
  'advantage_capitalization',
  'opening_improver',
  'intuition_trainer',
  '360_trainer',
  'tactics',
  'checkmate_patterns',
  'blindfold_tactics',
  'endgame_drill',
  'defender'
);
create type puzzle_source as enum ('own_game', 'lichess_db');

-- ── Tables ─────────────────────────────────────────────────────────────────────

create table user_settings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique,
  chesscom_username  text,
  lichess_username   text,
  onboarding_complete boolean not null default false,
  created_at   timestamptz not null default now()
);

create table games (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  pgn               text not null,
  source            game_source not null,
  source_game_id    text not null,
  result            text not null,
  user_color        text not null check (user_color in ('white', 'black')),
  time_control      text not null default '',
  opening_eco       text,
  played_at         timestamptz not null,
  analysis_complete boolean not null default false,
  created_at        timestamptz not null default now(),

  unique (source, source_game_id)
);

create table analyzed_moves (
  id             uuid primary key default gen_random_uuid(),
  game_id        uuid not null references games(id) on delete cascade,
  ply            integer not null,
  fen_before     text not null,
  played_move    text not null,
  best_move      text not null,
  eval_before    real not null,
  eval_after     real not null,
  cp_loss        real not null,
  classification move_classification not null,
  phase          game_phase not null,
  time_spent     real,
  created_at     timestamptz not null default now(),

  unique (game_id, ply)
);

create table skill_scores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  score_type  score_type not null,
  value       real not null check (value >= 0 and value <= 100),
  computed_at timestamptz not null default now()
);

create table puzzles (
  id             uuid primary key default gen_random_uuid(),
  fen            text not null,
  solution_pv    text not null,
  source         puzzle_source not null,
  theme_tags     text[] not null default '{}',
  source_game_id uuid references games(id) on delete set null,
  difficulty     real not null default 0,
  lesson_type    lesson_type not null,
  created_at     timestamptz not null default now()
);

create table drill_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  puzzle_id     uuid not null references puzzles(id) on delete cascade,
  correct       boolean not null,
  time_taken_ms integer not null,
  attempted_at  timestamptz not null default now()
);

create table study_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  week_start      date not null,
  focus_areas     score_type[] not null default '{}',
  drill_queue_ids uuid[] not null default '{}',
  created_at      timestamptz not null default now(),

  unique (user_id, week_start)
);

-- Cache for LLM explanations (Phase 6)
create table explanation_cache (
  id          uuid primary key default gen_random_uuid(),
  cache_key   text not null unique,
  explanation text not null,
  created_at  timestamptz not null default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────

create index idx_games_user_played on games (user_id, played_at desc);
create index idx_games_source_id on games (source, source_game_id);
create index idx_analyzed_moves_game on analyzed_moves (game_id, ply);
create index idx_skill_scores_user on skill_scores (user_id, computed_at desc);
create index idx_puzzles_source on puzzles (source, lesson_type);
create index idx_puzzles_game on puzzles (source_game_id) where source_game_id is not null;
create index idx_drill_attempts_user on drill_attempts (user_id, attempted_at desc);
create index idx_study_plans_user on study_plans (user_id, week_start desc);
create index idx_explanation_cache_key on explanation_cache (cache_key);

-- ── RLS ────────────────────────────────────────────────────────────────────────
-- Single-user for v1, but set up RLS as good practice.

alter table user_settings enable row level security;
alter table games enable row level security;
alter table analyzed_moves enable row level security;
alter table skill_scores enable row level security;
alter table puzzles enable row level security;
alter table drill_attempts enable row level security;
alter table study_plans enable row level security;
alter table explanation_cache enable row level security;

-- Allow authenticated users to manage their own data
create policy "users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own games"
  on games for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users read own analyzed moves"
  on analyzed_moves for select
  using (game_id in (select id from games where user_id = auth.uid()));

create policy "users insert analyzed moves"
  on analyzed_moves for insert
  with check (game_id in (select id from games where user_id = auth.uid()));

create policy "users delete analyzed moves"
  on analyzed_moves for delete
  using (game_id in (select id from games where user_id = auth.uid()));

create policy "users manage own scores"
  on skill_scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users read puzzles"
  on puzzles for select
  using (true);

create policy "users insert own puzzles"
  on puzzles for insert
  with check (
    source = 'lichess_db'
    or source_game_id in (select id from games where user_id = auth.uid())
  );

create policy "users manage own drill attempts"
  on drill_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own study plans"
  on study_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "anyone reads explanation cache"
  on explanation_cache for select
  using (true);

create policy "authenticated inserts explanation cache"
  on explanation_cache for insert
  with check (auth.uid() is not null);
