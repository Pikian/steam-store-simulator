/*
  # Fix authentication and RLS policies

  1. Changes
    - Add raw_user_meta_data column to auth.users if not exists
    - Update RLS policies to use raw_user_meta_data->>'username'
    - Simplify RLS policies for better reliability

  2. Security
    - Ensure proper access control based on user metadata
    - Maintain data integrity with proper constraints
*/

-- Ensure raw_user_meta_data exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'auth' 
    AND table_name = 'users' 
    AND column_name = 'raw_user_meta_data'
  ) THEN
    ALTER TABLE auth.users ADD COLUMN raw_user_meta_data jsonb;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

-- Create new policies with simplified checks
CREATE POLICY "Anyone can view suggestions"
  ON suggestions FOR SELECT
  USING (true);

CREATE POLICY "Users can create suggestions"
  ON suggestions FOR INSERT
  TO authenticated
  WITH CHECK (
    username = (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update own suggestions"
  ON suggestions FOR UPDATE
  TO authenticated
  USING (
    username = (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete own suggestions"
  ON suggestions FOR DELETE
  TO authenticated
  USING (
    username = (SELECT raw_user_meta_data->>'username' FROM auth.users WHERE id = auth.uid())
  );