import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  // Add storage configuration
  storage: {
    // Automatically retry failed uploads
    retryAttempts: 3,
    // Add cache control for better performance
    maxAge: 3600
  }
});

// Test database connection
supabase
  .from('allowed_users')
  .select('count')
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection error:', error);
    } else {
      console.log('✅ Supabase connection successful:', data);
    }
  });

// Debug logging for development
if (import.meta.env.DEV) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('Signed in with user metadata:', session?.user?.user_metadata);
    }
  });

  // Debug storage configuration
  supabase.storage.from('game_assets').list('').then(
    ({ data, error }) => {
      if (error) {
        console.error('Storage configuration error:', error);
      } else {
        console.log('Storage bucket accessible:', data);
      }
    }
  );
}