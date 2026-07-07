CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_month_category_unique
  ON public.budgets (user_id, month, category);