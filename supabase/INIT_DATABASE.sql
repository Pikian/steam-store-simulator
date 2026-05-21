-- ============================================
-- COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE SUGGESTIONS TABLE
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  about_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  header_image text NOT NULL DEFAULT '',
  screenshots text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  price decimal(10,2) DEFAULT 0.00,
  username text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_default boolean DEFAULT false
);

-- 2. ALLOWED_USERS TABLE - NO LONGER NEEDED
-- Now using Supabase Auth directly
-- Accounts are created on first login

-- 3. CREATE COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES suggestions(id) ON DELETE CASCADE,
  username text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. ENABLE RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 5. DROP OLD POLICIES (if they exist)
DROP POLICY IF EXISTS "Anyone can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Allow public read access" ON suggestions;
DROP POLICY IF EXISTS "Authenticated users can create" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions by username" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions by username" ON suggestions;

-- 6. CREATE SUGGESTIONS POLICIES
CREATE POLICY "Allow public read access"
  ON suggestions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own suggestions by username"
  ON suggestions
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

CREATE POLICY "Users can delete own suggestions by username"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (
    username = COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'username')::text,
      ''
    )
  );

-- 7. CREATE COMMENTS POLICIES
DROP POLICY IF EXISTS "Allow public read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;

CREATE POLICY "Allow public read comments"
  ON comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_suggestions_username ON suggestions(username);
CREATE INDEX IF NOT EXISTS idx_comments_suggestion_id ON comments(suggestion_id);

-- DONE! Database is ready.

