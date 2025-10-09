-- ============================================
-- CREATE TEAM MEMBER ACCOUNTS
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- This creates auth accounts for each team member
-- They can then sign in with: username + password

-- Note: Run this or have each person sign in once to auto-create their account
-- Password should be set by each user on first login

-- To manually create accounts via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Invite user" or "Add user"
-- 3. Use email format: username@steamstore.internal
-- 4. Set a password (share securely with team member)
-- 5. Set user_metadata: {"username": "TheirUsername"}

-- Example for SQL-based account creation (requires admin):
-- You can create accounts programmatically if needed:

/*
-- Sebastian
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sebastian@steamstore.internal',
  crypt('your-password-here', gen_salt('bf')),
  now(),
  '{"username": "Sebastian"}'::jsonb,
  now(),
  now()
);

-- Repeat for other team members...
*/

-- RECOMMENDED APPROACH:
-- Just have each team member sign in once with their desired password
-- The app will auto-create their account on first login

SELECT 'Setup complete! Team members can now sign in and accounts will be created automatically.' as message;
