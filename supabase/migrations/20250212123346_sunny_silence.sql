/*
  # Fix suggestions table and policies

  1. Changes
    - Add missing columns
    - Fix RLS policies
    - Add better constraints

  2. Security
    - Update RLS policies to use correct user metadata access
    - Ensure proper access control
*/

-- Add any missing columns and set proper defaults
ALTER TABLE suggestions
ALTER COLUMN title SET DEFAULT '',
ALTER COLUMN short_description SET DEFAULT '',
ALTER COLUMN long_description SET DEFAULT '',
ALTER COLUMN header_image SET DEFAULT '',
ALTER COLUMN screenshots SET DEFAULT ARRAY[]::text[],
ALTER COLUMN tags SET DEFAULT ARRAY[]::text[],
ALTER COLUMN price SET DEFAULT 0.00;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

-- Create new policies with proper user metadata access
CREATE POLICY "Anyone can view suggestions"
  ON suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    username = auth.jwt() -> 'user_metadata' ->> 'username'
  );

CREATE POLICY "Users can update own suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (
    username = auth.jwt() -> 'user_metadata' ->> 'username'
  );

CREATE POLICY "Users can delete own suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (
    username = auth.jwt() -> 'user_metadata' ->> 'username'
  );