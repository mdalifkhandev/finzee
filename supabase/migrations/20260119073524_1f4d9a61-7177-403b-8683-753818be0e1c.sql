-- Prevent duplicate goal names per user
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_name_unique
  ON public.goals (user_id, name);