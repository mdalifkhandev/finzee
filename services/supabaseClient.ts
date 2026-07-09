/**
 * services/supabaseClient.ts
 *
 * Expo-compatible Supabase client.
 * Reads credentials from EXPO_PUBLIC_ environment variables (never hardcoded).
 *
 * Setup:
 *   1. Copy .env.example -> .env
 *   2. Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   3. Run: npx expo install @supabase/supabase-js
 *
 * Security:
 *   - Only the publishable/anon key is used here.
 *   - The secret key must NEVER appear in this file or any client-side code.
 *   - .env is listed in .gitignore and will not be committed.
 */

import { CONFIG } from '../constants/config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type QueryBuilder = {
  eq: (col: string, val: any) => {
    order: (col: string, opts?: any) => Promise<{ data: any[]; error: null }>;
    single: () => Promise<{ data: any; error: null }>;
  };
  order: (col: string, opts?: any) => Promise<{ data: any[]; error: null }>;
  single: () => Promise<{ data: any; error: null }>;
};

type TableBuilder = {
  select: (cols?: string) => QueryBuilder;
  insert: (data: any) => { select: () => { single: () => Promise<{ data: any; error: null }> } };
  update: (data: any) => { eq: (col: string, val: any) => Promise<{ data: any; error: null }> };
  upsert: (data: any) => Promise<{ data: any; error: null }>;
};

type SupabaseClient = {
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>;
    signOut: () => Promise<{ error: null }>;
  };
  from: (table: string) => TableBuilder;
};

// ---------------------------------------------------------------------------
// Stub client — used when @supabase/supabase-js is not yet installed
// or env vars are missing. Prevents app crashes during early dev.
// ---------------------------------------------------------------------------
const createStub = (): SupabaseClient => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (_table: string): TableBuilder => ({
    select: (_cols?: string) => ({
      eq: (_col: string, _val: any) => ({
        order: (_col: string, _opts?: any) => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      order: (_col: string, _opts?: any) => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: (_data: any) => ({
      select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
    }),
    update: (_data: any) => ({
      eq: (_col: string, _val: any) => Promise.resolve({ data: null, error: null }),
    }),
    upsert: (_data: any) => Promise.resolve({ data: null, error: null }),
  }),
});

// ---------------------------------------------------------------------------
// Real client — initialised when env vars are present and SDK is installed.
// Uses a static import so Metro/Expo bundler can tree-shake correctly.
// ---------------------------------------------------------------------------
let _supabase: SupabaseClient = createStub();

if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
  try {
    // Static import is preferred in Expo (Metro bundler handles tree-shaking).
    // If the package is not installed yet, this will throw and fall back to stub.
    // Run `npx expo install @supabase/supabase-js` to activate the real client.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    _supabase = createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
      {
        auth: {
          flowType: 'pkce',
          // Required for React Native / Expo: disable browser-only storage
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }
    );
    if (__DEV__) {
      console.info('[Supabase] Real client initialised. URL:', CONFIG.SUPABASE_URL);
    }
  } catch (err) {
    console.warn(
      '[Supabase] @supabase/supabase-js not installed or failed to initialise.\n' +
      'Run: npx expo install @supabase/supabase-js\n' +
      'Using stub client until then.',
      err
    );
  }
} else {
  if (__DEV__) {
    console.warn(
      '[Supabase] Missing env vars: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.\n' +
      'Copy .env.example to .env and fill in your Supabase project credentials.'
    );
  }
}

// Export a single named instance used throughout the app.
export const supabase = _supabase;
