-- Adds tables required by the Impulse Blocker, Health metrics, and Wearables features.
-- Follows the same owner-scoped RLS + updated_at trigger conventions used elsewhere.

-- ---------------------------------------------------------------------------
-- pause_list_items — the Impulse Blocker / Pause List (24hr reflection).
-- The mobile Pause screen (app/(tabs)/pause.tsx) already reads this table.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pause_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  category text,
  source_url text,
  reason text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'bought', 'skipped', 'approved')),
  reminder_due_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pause_list_items_user_idx
  ON public.pause_list_items(user_id, status, created_at DESC);

ALTER TABLE public.pause_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_pause_read" ON public.pause_list_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_pause_insert" ON public.pause_list_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_pause_update" ON public.pause_list_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_pause_delete" ON public.pause_list_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_pause_list_items_updated_at
  BEFORE UPDATE ON public.pause_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- purchase_checks — log of "should I buy this?" evaluations from the
-- purchase-check screen (app/purchase-check.tsx).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  category text,
  urgency text,
  reason text,
  mood_level int,
  recommendation text,
  budget_impact text,
  goal_impact text,
  emotional_risk text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS purchase_checks_user_idx
  ON public.purchase_checks(user_id, created_at DESC);

ALTER TABLE public.purchase_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_purchase_checks_read" ON public.purchase_checks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_purchase_checks_insert" ON public.purchase_checks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_purchase_checks_delete" ON public.purchase_checks
  FOR DELETE USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- health_metrics — daily health/wearable snapshot per user per source.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('apple_health', 'google_fit', 'oura', 'garmin', 'fitbit', 'manual', 'mock')),
  sleep_hours numeric(4,2),
  steps int,
  heart_rate int,
  resting_heart_rate int,
  hrv_ms int,
  stress_indicator text CHECK (stress_indicator IN ('low', 'moderate', 'high')),
  readiness_score int,
  raw_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, source)
);

CREATE INDEX IF NOT EXISTS health_metrics_user_date_idx
  ON public.health_metrics(user_id, date DESC);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_health_read" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_health_insert" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_health_update" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_health_delete" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_health_metrics_updated_at
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- wearable_tokens — encrypted-at-rest OAuth tokens for wearable providers.
-- Written only by edge functions using the service role. No client access.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wearable_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('oura', 'garmin', 'fitbit')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE public.wearable_tokens ENABLE ROW LEVEL SECURITY;

-- Owner may read/delete their own connection status; tokens are written by the
-- service role only (edge functions), so no INSERT/UPDATE policy is granted.
CREATE POLICY "owner_wearable_read" ON public.wearable_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_wearable_delete" ON public.wearable_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_wearable_tokens_updated_at
  BEFORE UPDATE ON public.wearable_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
