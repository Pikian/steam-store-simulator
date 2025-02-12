/*
  # Update authentication to use usernames

  1. Changes
    - Add username column to auth.users
    - Add unique constraint on username
    - Update RLS policies to use username
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add username column to auth.users
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Update suggestions table to reference username
ALTER TABLE suggestions
ADD COLUMN IF NOT EXISTS username text REFERENCES auth.users(username);

-- Update existing suggestions to use username
UPDATE suggestions s
SET username = u.username
FROM auth.users u
WHERE s.created_by = u.id;

-- Update RLS policies to use username
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

CREATE POLICY "Anyone can view suggestions"
  ON suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'username' = username);

CREATE POLICY "Users can update own suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'username' = username)
  WITH CHECK (auth.jwt()->>'username' = username);

CREATE POLICY "Users can delete own suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'username' = username);