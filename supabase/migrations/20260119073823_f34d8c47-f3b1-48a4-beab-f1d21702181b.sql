-- Add missing columns for goals upsert
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;

-- Backfill kind from name for existing rows
UPDATE public.goals SET kind = name WHERE kind IS NULL;

-- Create unique index for upsert on (user_id, kind)
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_kind_unique ON public.goals (user_id, kind);