-- Create allowed_users table
CREATE TABLE IF NOT EXISTS public.allowed_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert allowed users
INSERT INTO public.allowed_users (username, password_hash)
VALUES 
  ('Sebastian', 'bark'),
  ('Bjorne', 'bark'),
  ('Pelle', 'bark'),
  ('Martin', 'bark'),
  ('Jacqueline', 'bark'),
  ('Hannes', 'bark')
ON CONFLICT (username) 
DO UPDATE SET password_hash = EXCLUDED.password_hash; 