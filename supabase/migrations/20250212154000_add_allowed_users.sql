/*
  # Add allowed users
  
  Add the following users with password 'bark':
  - Sebastian
  - Bjorne
  - Pelle
  - Martin
  - Jacqueline
  - Hannes
*/

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