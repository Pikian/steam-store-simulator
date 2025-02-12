/*
  # Make all content private and accessible only to authenticated users
  
  Changes:
  - Remove public access to storage
  - Restrict all storage operations to authenticated users
  - Update RLS policies for suggestions table
  - Add allowed users table for access control
*/

-- Create allowed_users table
CREATE TABLE IF NOT EXISTS public.allowed_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remove existing storage policies
DROP POLICY IF EXISTS "Public can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own game assets" ON storage.objects;

-- Authenticated users can view game assets
CREATE POLICY "Authenticated users can view game assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'game_assets');

-- Authenticated users can upload with size and type restrictions
CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_assets' AND
  (auth.uid() = owner) AND
  (LENGTH(COALESCE(name, '')) < 255) AND
  (octet_length(COALESCE(content, '')) < 100000000) AND -- ~100MB limit
  (LOWER(SUBSTRING(name FROM '.+\.(.+)$')) IN (
    'png', 'jpg', 'jpeg', 'gif', 'webp',  -- Image types
    'mp4', 'webm'                         -- Video types
  ))
);

-- Users can only update their own files
CREATE POLICY "Users can update own game assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game_assets' AND owner = auth.uid())
WITH CHECK (bucket_id = 'game_assets' AND owner = auth.uid());

-- Users can only delete their own files
CREATE POLICY "Users can delete own game assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game_assets' AND owner = auth.uid());

-- Update suggestions table policies
DROP POLICY IF EXISTS "Public can view suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can create suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON suggestions;
DROP POLICY IF EXISTS "Users can delete own suggestions" ON suggestions;

-- Only authenticated users can view suggestions
CREATE POLICY "Authenticated users can view suggestions"
ON suggestions FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can create suggestions
CREATE POLICY "Authenticated users can create suggestions"
ON suggestions FOR INSERT
TO authenticated
WITH CHECK (
  username = auth.jwt()->>'preferred_username'
);

-- Only owners can update their suggestions
CREATE POLICY "Users can update own suggestions"
ON suggestions FOR UPDATE
TO authenticated
USING (username = auth.jwt()->>'preferred_username')
WITH CHECK (username = auth.jwt()->>'preferred_username');

-- Only owners can delete their suggestions
CREATE POLICY "Users can delete own suggestions"
ON suggestions FOR DELETE
TO authenticated
USING (username = auth.jwt()->>'preferred_username'); 