-- Read-only preflight for migration 202611260001_add_monthly_budget.sql.
-- Run this before and after deployment to confirm the column and reset RPC.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'households'
  and column_name = 'monthly_budget_cents';

select pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'wipe_own_household';
