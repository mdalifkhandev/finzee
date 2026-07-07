export const CONFIG = {
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

export const DEV_SAMPLE = {
  userId: 'dev-user-001',
  email: 'demo@finzee.ai',
  displayName: 'Alex Demo',
  monthlyBudget: 3000,
};
