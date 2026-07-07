-- Clean up duplicate policies and recreate with consistent naming
DROP POLICY IF EXISTS "goals_owner_select" ON public.goals;
DROP POLICY IF EXISTS "goals_owner_insert" ON public.goals;
DROP POLICY IF EXISTS "goals_owner_update" ON public.goals;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

-- Recreate clean policies
CREATE POLICY goals_owner_select ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY goals_owner_insert ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_owner_update ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY goals_owner_delete ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Prevent cross-user collisions: one "kind" per user
CREATE UNIQUE INDEX IF NOT EXISTS goals_user_kind_unique ON public.goals (user_id, kind);