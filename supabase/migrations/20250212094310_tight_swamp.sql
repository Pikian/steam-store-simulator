/*
  # Fix JWT policies and permissions

  1. Changes
    - Remove foreign key constraint
    - Add username index
    - Update policies to use correct JWT claim syntax
    - Simplify policy checks

  2. Security
    - Use correct JWT claim access
    - Maintain proper access control
*/

-- Drop existing foreign key constraint that's causing issues
ALTER TABLE suggestions
DROP CONSTRAINT IF EXISTS suggestions_username_fkey;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS suggestions_username_idx ON suggestions(username);

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

-- Create new policies using JWT claims with correct syntax
CREATE POLICY "Anyone can view suggestions"
  ON suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    username = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username'
  );

CREATE POLICY "Users can update own suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (
    username = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username'
  );

CREATE POLICY "Users can delete own suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (
    username = (auth.jwt() ->> 'user_metadata')::jsonb ->> 'username'
  );