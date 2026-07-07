-- Change primary key to composite (user_id, id) for better partitioning
ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_pkey CASCADE;

ALTER TABLE public.goals
  ADD CONSTRAINT goals_pk PRIMARY KEY (user_id, id);