/*
  # Secure storage while maintaining public access to media
  
  Changes:
  - Allow public read access to game assets
  - Restrict uploads to authenticated users
  - Restrict modifications to file owners
  - Add file size limits
*/

-- Remove existing policies
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own game assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own game assets" ON storage.objects;

-- Public read access
CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
TO public
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