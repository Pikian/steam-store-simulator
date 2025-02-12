/*
  # Fix RLS policies for suggestions table

  1. Changes
    - Add NOT NULL constraint to username column
    - Update RLS policies to use username instead of created_by
    - Remove created_by column as we're using username for identification
    - Add cascade delete for user cleanup

  2. Security
    - Enable RLS
    - Update policies to use username for authentication
    - Ensure proper access control for all operations
*/

-- Make username NOT NULL and drop created_by column
ALTER TABLE suggestions
ALTER COLUMN username SET NOT NULL,
DROP COLUMN IF EXISTS created_by;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

-- Create new policies
CREATE POLICY "Anyone can view suggestions"
  ON suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt()->>'username' = username
  );

CREATE POLICY "Users can update own suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (
    auth.jwt()->>'username' = username
  )
  WITH CHECK (
    auth.jwt()->>'username' = username
  );

CREATE POLICY "Users can delete own suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (
    auth.jwt()->>'username' = username
  );

-- Add cascade delete for user cleanup
ALTER TABLE suggestions
DROP CONSTRAINT IF EXISTS suggestions_username_fkey,
ADD CONSTRAINT suggestions_username_fkey
  FOREIGN KEY (username)
  REFERENCES auth.users(username)
  ON DELETE CASCADE;