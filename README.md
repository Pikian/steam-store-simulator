# Steam Store Simulator

Design and preview Steam store pages for your game. Edit copy, manage media, and collaborate with your team.

## Setup

1. **Deploy to Vercel** and add Supabase integration (creates project automatically)
2. **Run migrations** in Supabase SQL Editor (files in `supabase/migrations/`)
3. **Create storage bucket** named `game_assets` (public)
4. **Visit your app** and sign in

## Team Login

- **Usernames**: Sebastian, Bjorne, Pelle, Martin, Jacqueline, Hannes
- **Password**: `bark` (for all users)

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
