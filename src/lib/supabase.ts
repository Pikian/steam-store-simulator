import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'steam-store-auth',
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  storage: {
    retryAttempts: 3,
    maxAge: 3600
  }
});

// Debug logging for development
if (import.meta.env.DEV) {
  // Test database connection
  supabase
    .from('suggestions')
    .select('count')
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Supabase connection error:', error);
      } else {
        console.log('✅ Supabase connection successful');
      }
    });

  // Monitor auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    if (event === 'SIGNED_IN' && session) {
      console.log('Signed in:', session.user.user_metadata?.username);
    } else if (event === 'SIGNED_OUT') {
      console.log('Signed out');
    }
  });
}