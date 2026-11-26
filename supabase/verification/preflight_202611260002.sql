-- Read-only preflight for migration 202611260002_transaction_page_rpc.sql.
select p.proname, pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer, p.provolatile as volatility
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_transactions_page';

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'expenses_household_category_date_idx',
    'incomes_household_category_date_idx',
    'expenses_household_member_date_idx',
    'incomes_household_member_date_idx'
  )
order by indexname;
