-- RLS & uniqueness (prevents merging across users)

create unique index if not exists goals_user_kind_unique
  on public.goals (user_id, kind);

create unique index if not exists budgets_user_month_category_unique
  on public.budgets (user_id, month, category);

alter table public.goals   enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.accounts enable row level security;

drop policy if exists goals_owner_select on public.goals;
drop policy if exists goals_owner_insert on public.goals;
drop policy if exists goals_owner_update on public.goals;

create policy goals_owner_select on public.goals   for select using (auth.uid() = user_id);
create policy goals_owner_insert on public.goals   for insert with check (auth.uid() = user_id);
create policy goals_owner_update on public.goals   for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists budgets_owner_select on public.budgets;
drop policy if exists budgets_owner_upsert on public.budgets;

create policy budgets_owner_select on public.budgets for select using (auth.uid() = user_id);
create policy budgets_owner_upsert  on public.budgets for insert with check (auth.uid() = user_id);

drop policy if exists tx_owner_select on public.transactions;
drop policy if exists tx_owner_insert on public.transactions;

create policy tx_owner_select on public.transactions for select using (auth.uid() = user_id);
create policy tx_owner_insert on public.transactions for insert with check (auth.uid() = user_id);

drop policy if exists acct_owner_select on public.accounts;
drop policy if exists acct_owner_upsert on public.accounts;

create policy acct_owner_select on public.accounts for select using (auth.uid() = user_id);
create policy acct_owner_upsert  on public.accounts for insert with check (auth.uid() = user_id);