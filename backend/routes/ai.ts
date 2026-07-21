// Adapter route for the existing Supabase Edge Function AI implementation.
// Keeps the requested backend/routes/ai.ts entrypoint discoverable without
// duplicating model routing or changing the current Supabase architecture.

export { runAI, extractJSON } from '../../supabase/functions/_ai';
export type { AIOptions, AIResult } from '../../supabase/functions/_ai';
