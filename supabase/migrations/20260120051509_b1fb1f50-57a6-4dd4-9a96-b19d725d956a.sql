-- Add unique constraint for accounts upsert (non-conditional, for onConflict support)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_provider_external_id_unique
  ON public.accounts (user_id, provider, external_id);