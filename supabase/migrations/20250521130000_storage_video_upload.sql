-- Allow larger video uploads and simplify extension checks for game_assets

UPDATE storage.buckets
SET file_size_limit = 524288000  -- 500 MB (also raise global limit in Dashboard → Storage → Settings)
WHERE id = 'game_assets';

DROP POLICY IF EXISTS "Authenticated users can upload game assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_assets'
  AND char_length(name) < 255
  AND lower(storage.extension(name)) IN (
    'png', 'jpg', 'jpeg', 'gif', 'webp',
    'mp4', 'webm'
  )
);
