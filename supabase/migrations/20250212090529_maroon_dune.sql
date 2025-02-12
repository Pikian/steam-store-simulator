/*
  # Add developer and publisher fields

  1. Changes
    - Add developer and publisher columns to suggestions table
    - Update storage bucket policy to handle file size limits correctly
*/

-- Add new columns to suggestions table
ALTER TABLE suggestions
ADD COLUMN IF NOT EXISTS developer text DEFAULT '',
ADD COLUMN IF NOT EXISTS publisher text DEFAULT '';

-- Update storage policy to handle file size limits correctly
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_assets' AND
  (LENGTH(COALESCE(name, '')) < 255) AND
  (LOWER(SUBSTRING(name FROM '.+\.(.+)$')) IN ('png', 'jpg', 'jpeg', 'gif', 'webp'))
);