-- Add current_rating to user_settings for rating-relative scoring
ALTER TABLE user_settings ADD COLUMN current_rating integer DEFAULT NULL;
ALTER TABLE user_settings ADD COLUMN target_rating integer DEFAULT NULL;
