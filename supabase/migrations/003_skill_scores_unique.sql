-- Add unique constraint on (user_id, score_type) for skill_scores
-- Required for upsert in computeAllSkills
ALTER TABLE skill_scores ADD CONSTRAINT skill_scores_user_type_unique UNIQUE (user_id, score_type);
