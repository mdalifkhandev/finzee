-- Push token storage for Expo push notifications.
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL UNIQUE,
  platform text,
  enabled boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_idx
  ON public.push_tokens(user_id, enabled);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_tokens_owner_select ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_owner_insert ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_owner_update ON public.push_tokens;
DROP POLICY IF EXISTS push_tokens_owner_delete ON public.push_tokens;

CREATE POLICY push_tokens_owner_select ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_tokens_owner_insert ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_owner_update ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY push_tokens_owner_delete ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deduplicated log so one budget alert per threshold can be sent once per period.
CREATE TABLE IF NOT EXISTS public.budget_alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  month_start date NOT NULL,
  threshold_pct integer NOT NULL,
  percent_used numeric(6,2) NOT NULL,
  amount_spent numeric(12,2) NOT NULL,
  amount_limit numeric(12,2) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS budget_alert_logs_user_idx
  ON public.budget_alert_logs(user_id, month_start DESC);

CREATE UNIQUE INDEX IF NOT EXISTS budget_alert_logs_unique_idx
  ON public.budget_alert_logs(user_id, budget_id, month_start, threshold_pct);

ALTER TABLE public.budget_alert_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_alert_logs_owner_select ON public.budget_alert_logs;
CREATE POLICY budget_alert_logs_owner_select ON public.budget_alert_logs
  FOR SELECT USING (auth.uid() = user_id);

