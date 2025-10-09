-- ============================================
-- UPDATE STORAGE BUCKET SETTINGS
-- Run this in Supabase SQL Editor
-- ============================================

-- Note: Bucket file size limits are set in the Supabase Dashboard
-- This is just documentation of what needs to be done

-- To increase file upload limits:
-- 1. Go to Supabase Dashboard > Storage > game_assets
-- 2. Click "Edit bucket"
-- 3. Set "File size limit" to 500 MB (or your desired limit)
-- 4. Make sure "Public bucket" is checked
-- 5. Save

-- The default Supabase limit is 50MB per file
-- You need to increase this in the dashboard to support larger videos

SELECT 'Storage bucket settings must be updated in the Supabase Dashboard' as message;
