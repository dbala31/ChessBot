-- Expand move_classification enum with richer categories
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'brilliant';
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'great';
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'excellent';
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'book';
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'dubious';
ALTER TYPE move_classification ADD VALUE IF NOT EXISTS 'miss';
