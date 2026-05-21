ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS about_blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
