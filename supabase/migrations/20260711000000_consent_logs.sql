-- Consent audit log for profile settings and onboarding preferences.
-- Stores snapshots of user consent changes so the app can persist toggles
-- like financial data usage, health data usage, AI personalization, and
-- push reminders.

CREATE TABLE IF NOT EXISTS public.consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  financial_data boolean,
  health_data boolean,
  ai_personalization boolean,
  push_reminders boolean,
  terms_accepted boolean,
  consented_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per user: collapse any historical duplicates into the latest
-- known value for each consent flag before enforcing uniqueness.
CREATE TEMP TABLE consent_logs_consolidated AS
WITH users AS (
  SELECT DISTINCT user_id
  FROM public.consent_logs
),
consolidated AS (
  SELECT
    u.user_id,
    COALESCE((
      SELECT c.financial_data
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id AND c.financial_data IS NOT NULL
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), false) AS financial_data,
    COALESCE((
      SELECT c.health_data
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id AND c.health_data IS NOT NULL
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), false) AS health_data,
    COALESCE((
      SELECT c.ai_personalization
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id AND c.ai_personalization IS NOT NULL
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), false) AS ai_personalization,
    COALESCE((
      SELECT c.push_reminders
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id AND c.push_reminders IS NOT NULL
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), false) AS push_reminders,
    COALESCE((
      SELECT c.terms_accepted
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id AND c.terms_accepted IS NOT NULL
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), false) AS terms_accepted,
    COALESCE((
      SELECT c.consented_at
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), now()) AS consented_at,
    COALESCE((
      SELECT c.updated_at
      FROM public.consent_logs c
      WHERE c.user_id = u.user_id
      ORDER BY c.updated_at DESC, c.consented_at DESC, c.id DESC
      LIMIT 1
    ), now()) AS updated_at
  FROM users u
)
SELECT
  user_id,
  financial_data,
  health_data,
  ai_personalization,
  push_reminders,
  terms_accepted,
  consented_at,
  updated_at
FROM consolidated;

DELETE FROM public.consent_logs;

INSERT INTO public.consent_logs (
  user_id,
  financial_data,
  health_data,
  ai_personalization,
  push_reminders,
  terms_accepted,
  consented_at,
  updated_at
)
SELECT
  user_id,
  financial_data,
  health_data,
  ai_personalization,
  push_reminders,
  terms_accepted,
  consented_at,
  updated_at
FROM consent_logs_consolidated;

DROP TABLE consent_logs_consolidated;

CREATE INDEX IF NOT EXISTS consent_logs_user_idx
  ON public.consent_logs(user_id, consented_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS consent_logs_user_unique_idx
  ON public.consent_logs(user_id);

ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_consent_read" ON public.consent_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_consent_insert" ON public.consent_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner_consent_update" ON public.consent_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owner_consent_delete" ON public.consent_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_consent_logs_updated_at
  BEFORE UPDATE ON public.consent_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
