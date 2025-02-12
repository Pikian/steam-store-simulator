/*
  # Enable RLS on allowed_users table
  
  This migration:
  1. Enables RLS on the allowed_users table
  2. Creates a policy to allow anyone to check credentials
*/

-- Enable RLS
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow checking credentials
CREATE POLICY "Anyone can check credentials"
ON public.allowed_users
FOR SELECT
TO public
USING (true);

-- Ensure the table is accessible
GRANT SELECT ON public.allowed_users TO anon;
GRANT SELECT ON public.allowed_users TO authenticated; 