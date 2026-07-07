-- Rename transactions columns
ALTER TABLE public.transactions 
  RENAME COLUMN date TO ts;

ALTER TABLE public.transactions 
  ALTER COLUMN ts TYPE timestamptz USING ts::timestamptz;

ALTER TABLE public.transactions 
  RENAME COLUMN category TO categories;

ALTER TABLE public.transactions 
  ALTER COLUMN categories TYPE text[] USING ARRAY[categories];

-- Rename budgets columns
ALTER TABLE public.budgets 
  RENAME COLUMN amount TO limit_amount;

ALTER TABLE public.budgets 
  RENAME COLUMN spent TO spent_amount;

ALTER TABLE public.budgets 
  RENAME COLUMN start_date TO month;