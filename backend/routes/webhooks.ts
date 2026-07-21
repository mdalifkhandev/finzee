// Adapter references for existing webhook Edge Function implementations.
// Keeps this requested file discoverable without moving route ownership away
// from the current Supabase functions architecture.

export const webhookFunctions = {
  plaid: 'plaid-webhook',
} as const;

export type WebhookFunctionName = typeof webhookFunctions[keyof typeof webhookFunctions];
