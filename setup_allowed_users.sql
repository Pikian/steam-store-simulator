-- Drop the table if it exists (optional, comment out if you want to keep existing data)
DROP TABLE IF EXISTS public.allowed_users;

-- Create allowed_users table
CREATE TABLE public.allowed_users (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert allowed users with longer passwords
INSERT INTO public.allowed_users (username, password_hash)
VALUES 
    ('Sebastian', 'barkbark'),
    ('Bjorne', 'barkbark'),
    ('Pelle', 'barkbark'),
    ('Martin', 'barkbark'),
    ('Jacqueline', 'barkbark'),
    ('Hannes', 'barkbark')
ON CONFLICT (username) 
DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Grant necessary permissions
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Allow public to check credentials" ON public.allowed_users;

-- Create policy to allow public access for login checks
CREATE POLICY "Allow public to check credentials"
ON public.allowed_users
FOR SELECT
TO public
USING (true);

-- Verify the table was created and data was inserted
SELECT COUNT(*) as total_users FROM public.allowed_users;
SELECT * FROM public.allowed_users WHERE username = 'Sebastian'; 