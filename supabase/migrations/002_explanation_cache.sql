-- Explanation cache for LLM-generated move explanations
CREATE TABLE IF NOT EXISTS explanation_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text UNIQUE NOT NULL,
  explanation text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_explanation_cache_key ON explanation_cache (cache_key);
