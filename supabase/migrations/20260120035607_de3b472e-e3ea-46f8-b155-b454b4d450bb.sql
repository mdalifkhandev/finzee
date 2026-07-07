-- Strong RLS
alter table public.goals enable row level security;

drop policy if exists goals_owner_select on public.goals;
drop policy if exists goals_owner_insert on public.goals;
drop policy if exists goals_owner_update on public.goals;

create policy goals_owner_select on public.goals for select using (auth.uid() = user_id);
create policy goals_owner_insert on public.goals for insert with check (auth.uid() = user_id);
create policy goals_owner_update on public.goals for update using (auth.uid() = user_id);

-- Make goals unique per-user by "kind"
create unique index if not exists goals_user_kind_unique
  on public.goals (user_id, kind);