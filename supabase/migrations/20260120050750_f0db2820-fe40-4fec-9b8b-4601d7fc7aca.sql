-- Add missing columns to accounts
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS mask text;

-- RLS is already enabled, but ensure it
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with consistent naming
DROP POLICY IF EXISTS "Users can view their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can insert their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can update their own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can delete their own accounts" ON public.accounts;
DROP POLICY IF EXISTS acct_owner_select ON public.accounts;
DROP POLICY IF EXISTS acct_owner_upsert ON public.accounts;
DROP POLICY IF EXISTS acct_owner_update ON public.accounts;
DROP POLICY IF EXISTS acct_owner_delete ON public.accounts;

-- Create strong owner-only RLS policies
CREATE POLICY acct_owner_select ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY acct_owner_insert ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY acct_owner_update ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY acct_owner_delete ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Unique index when external_id is present
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_provider_ext_unique
  ON public.accounts (user_id, provider, external_id)
  WHERE external_id IS NOT NULL;

-- Fallback unique index when external_id is null (uses provider + mask)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_user_provider_mask_unique
  ON public.accounts (user_id, provider, mask)
  WHERE external_id IS NULL;