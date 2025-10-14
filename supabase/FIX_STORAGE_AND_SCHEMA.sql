-- ============================================
-- FIX STORAGE BUCKET AND SCHEMA ISSUES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ENSURE IS_DEFAULT COLUMN EXISTS
-- Add is_default column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suggestions' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE public.suggestions ADD COLUMN is_default boolean DEFAULT false;
  END IF;
END $$;

-- Create unique index to ensure only one default template per user
DROP INDEX IF EXISTS suggestions_default_unique_idx;
CREATE UNIQUE INDEX suggestions_default_unique_idx 
ON public.suggestions (username) 
WHERE is_default = true;

-- 2. ENSURE GAME_ASSETS BUCKET EXISTS
-- Insert bucket if it doesn't exist (this will fail silently if it exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('game_assets', 'Game Assets', true)
ON CONFLICT (id) DO NOTHING;

-- 3. DROP ALL EXISTING STORAGE POLICIES
DROP POLICY IF EXISTS "Public can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own game assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload game assets" ON storage.objects;

-- 4. CREATE NEW STORAGE POLICIES
-- Allow anyone (including anonymous) to view game assets
CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game_assets');

-- Allow authenticated users to upload with restrictions
CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_assets' AND
  (LENGTH(COALESCE(name, '')) < 255) AND
  (LOWER(SUBSTRING(name FROM '.+\.(.+)$')) IN (
    'png', 'jpg', 'jpeg', 'gif', 'webp',  -- Image types
    'mp4', 'webm'                         -- Video types
  ))
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated users can update game assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'game_assets' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'game_assets' AND auth.uid() = owner);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete game assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'game_assets' AND auth.uid() = owner);

-- 5. VERIFY SETUP
-- Check if bucket exists
SELECT 
  'Bucket exists: ' || COALESCE(name, 'NOT FOUND') as status
FROM storage.buckets 
WHERE id = 'game_assets';

-- Check storage policies
SELECT 
  'Storage policies count: ' || COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Check if is_default column exists
SELECT 
  'is_default column exists: ' || CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as status
FROM information_schema.columns 
WHERE table_name = 'suggestions' 
AND column_name = 'is_default';

-- DONE!

