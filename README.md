# Steam Store Simulator

Design and preview Steam store pages for your game. Edit copy, manage media, and collaborate with your team.

## Setup

1. **Deploy to Vercel** and add Supabase integration (creates project automatically)
2. **Run migrations** in Supabase SQL Editor (files in `supabase/migrations/`)
3. **Create storage bucket** named `game_assets` (public)
4. **Visit your app** and sign in

## Team Login

- Enter your **@trollheimstudios.com** email address
- Click the magic link sent to your email
- No password needed - just click and you're in!
- Only company email addresses are allowed

## Local Development

```bash
# Create .env.local with Supabase credentials
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

npm install
npm run dev
```

## Tech Stack

React + TypeScript + Vite + Supabase + Tailwind
