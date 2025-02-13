-- Set admin privileges for the operation
SELECT set_claim('current_username', 'Pikian');

-- Delete all non-default suggestions
DELETE FROM suggestions 
WHERE is_default IS NOT TRUE;

-- Verify the cleanup
SELECT id, title, username, is_default 
FROM suggestions 
ORDER BY created_at DESC; 