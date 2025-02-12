/*
  # Add default suggestion functionality
  
  1. Changes
    - Add `is_default` column to suggestions table
    - Add unique constraint to ensure only one default suggestion per user
    - Add policies to manage default suggestions
    
  2. Security
    - Only allow Pikian to set default suggestions
    - Everyone can view the default suggestion
*/

-- Add is_default column
ALTER TABLE suggestions
ADD COLUMN is_default boolean DEFAULT false;

-- Create a unique index to ensure only one default suggestion per user
CREATE UNIQUE INDEX suggestions_default_unique_idx ON suggestions (username) WHERE is_default = true;

-- Create policy for setting default suggestion (only Pikian can set defaults)
CREATE POLICY "Only Pikian can set default suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() -> 'user_metadata' ->> 'username' = 'Pikian'
  )
  WITH CHECK (
    auth.jwt() -> 'user_metadata' ->> 'username' = 'Pikian'
  );