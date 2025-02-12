/*
  # Add storage buckets for game assets

  1. New Storage Buckets
    - `game_assets`: For storing game-related images and media
      - Header images
      - Screenshots
      - Artwork
  
  2. Security
    - Enable public read access
    - Restrict uploads to authenticated users
    - Add size and type restrictions
*/

-- Create a bucket for game assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('game_assets', 'Game Assets', true);

-- Set up storage policies
CREATE POLICY "Public can view game assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'game_assets');

CREATE POLICY "Authenticated users can upload game assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'game_assets' AND
  (LENGTH(COALESCE(name, '')) < 255) AND
  (LOWER(SUBSTRING(name FROM '.+\.(.+)$')) IN ('png', 'jpg', 'jpeg', 'gif', 'webp'))
);