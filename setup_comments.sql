-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    suggestion_id UUID NOT NULL REFERENCES public.suggestions(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create policies
CREATE POLICY "Anyone can view comments"
ON public.comments
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can create comments"
ON public.comments
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO public
USING (username = current_user)
WITH CHECK (username = current_user);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
TO public
USING (username = current_user);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS comments_suggestion_id_idx ON public.comments(suggestion_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 