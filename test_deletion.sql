-- Reset the session
RESET ALL;

-- Test deletion as Pikian
SELECT set_claim('app.current_username', 'Pikian');
SELECT current_setting('app.current_username', true);
SELECT is_admin();

-- Verify suggestion exists
SELECT id, username FROM suggestions WHERE id = '81bfb616-2cbd-4892-b404-3f4f18832110';

-- Attempt deletion
DELETE FROM suggestions WHERE id = '81bfb616-2cbd-4892-b404-3f4f18832110'
RETURNING id, username;

-- Verify deletion
SELECT id, username FROM suggestions WHERE id = '81bfb616-2cbd-4892-b404-3f4f18832110';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'suggestions';

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'suggestions';