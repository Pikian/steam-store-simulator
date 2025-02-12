/*
  # Steam Store Preview Database Schema

  1. New Tables
    - `suggestions`
      - `id` (uuid, primary key)
      - `title` (text) - Game title
      - `short_description` (text) - Brief game description
      - `long_description` (text) - Detailed game description
      - `header_image` (text) - URL of the main store image
      - `screenshots` (text[]) - Array of screenshot URLs
      - `tags` (text[]) - Array of game tags
      - `price` (decimal) - Game price
      - `created_by` (uuid) - Reference to auth.users
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on suggestions table
    - Add policies for CRUD operations
*/

CREATE TABLE suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  header_image text NOT NULL DEFAULT '',
  screenshots text[] DEFAULT ARRAY[]::text[],
  tags text[] DEFAULT ARRAY[]::text[],
  price decimal(10,2) DEFAULT 0.00,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Allow users to read all suggestions
CREATE POLICY "Anyone can view suggestions"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create suggestions
CREATE POLICY "Users can create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own suggestions
CREATE POLICY "Users can update own suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own suggestions
CREATE POLICY "Users can delete own suggestions"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);