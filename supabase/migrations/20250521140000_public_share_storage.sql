-- Restore public read access on game_assets so shared capsule previews work without login

DROP POLICY IF EXISTS "Public can view game assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view game assets" ON storage.objects;

CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'game_assets');

UPDATE storage.buckets
SET public = true
WHERE id = 'game_assets';
