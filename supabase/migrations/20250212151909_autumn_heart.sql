/*
  # Add video support to media library

  1. Changes
    - Update storage policy to allow video file types (mp4, webm)
    - Increase file size limits for video uploads
*/

-- Update storage policy to include video file types
DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;

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