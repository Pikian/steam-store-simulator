/*
  # Fix Authentication and Schema Alignment
  
  This migration aligns the database with the current app implementation:
  1. Ensures username field exists on suggestions table
  2. Updates RLS policies to allow proper access for authenticated users
  3. Makes suggestions readable by anonymous users (for sharing)
  4. Keeps edit/delete restricted to owners
*/

-- Add username field if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'suggestions' 
                 AND column_name = 'username') THEN
    ALTER TABLE public.suggestions ADD COLUMN username TEXT;
  END IF;
END $$;

-- Make username not null with default
ALTER TABLE public.suggestions 
  ALTER COLUMN username SET DEFAULT '',
  ALTER COLUMN username SET NOT NULL;

-- Drop old restrictive policies if they exist
DROP POLICY IF EXISTS "Anyone can view suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON public.suggestions;

-- Create new permissive policies for team collaboration

-- Allow anyone (even anonymous) to read all suggestions (for sharing feature)
CREATE POLICY "Allow public read access"
  ON public.suggestions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to create suggestions
CREATE POLICY "Authenticated users can create"
  ON public.suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own suggestions (by username)
-- We check the username from user_metadata stored in the JWT
CREATE POLICY "Users can update own suggestions by username"
  ON public.suggestions
  FOR UPDATE
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username')::text,
      ''
    )
  )
  WITH CHECK (
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username')::text,
      ''
    )
  );

-- Allow users to delete their own suggestions (by username)
CREATE POLICY "Users can delete own suggestions by username"
  ON public.suggestions
  FOR DELETE
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username')::text,
      ''
    )
  );

-- Make created_by nullable (may not be set for existing records)
ALTER TABLE public.suggestions ALTER COLUMN created_by DROP NOT NULL;

-- Create index on username for better query performance
CREATE INDEX IF NOT EXISTS idx_suggestions_username ON public.suggestions(username);

-- Update storage bucket policies to allow authenticated uploads
-- Note: This needs to be run in Supabase dashboard or via storage.createBucket API
-- For now, ensure game_assets bucket exists and is public

-- Comments table policies (if comments table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
    DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
    
    -- Allow anyone to read comments
    EXECUTE 'CREATE POLICY "Allow public read comments"
      ON public.comments
      FOR SELECT
      TO anon, authenticated
      USING (true)';
    
    -- Allow authenticated users to create comments
    EXECUTE 'CREATE POLICY "Authenticated users can create comments"
      ON public.comments
      FOR INSERT
      TO authenticated
      WITH CHECK (true)';
  END IF;
END $$;

