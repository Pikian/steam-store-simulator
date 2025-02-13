-- Enable RLS on suggestions table
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Anyone can create suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Anyone can update suggestions" ON public.suggestions;
DROP POLICY IF EXISTS "Anyone can delete suggestions" ON public.suggestions;

-- Allow anyone to view suggestions
CREATE POLICY "Anyone can view suggestions"
ON public.suggestions
FOR SELECT
TO public
USING (true);

-- Allow anyone to create suggestions
CREATE POLICY "Anyone can create suggestions"
ON public.suggestions
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to update suggestions
CREATE POLICY "Anyone can update suggestions"
ON public.suggestions
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Allow anyone to delete suggestions
CREATE POLICY "Anyone can delete suggestions"
ON public.suggestions
FOR DELETE
TO public
USING (true);

-- Force RLS to be enabled
ALTER TABLE public.suggestions FORCE ROW LEVEL SECURITY;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'suggestions';

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'suggestions';

-- Check if RLS is enabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'suggestions'; 