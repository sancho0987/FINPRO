-- Server-side filtering, ordering, pagination and totals for the transaction list.
-- SECURITY INVOKER keeps the caller's RLS policies in force.
create or replace function public.get_transactions_page(
  p_household_id uuid,
  p_from date default null,
  p_to date default null,
  p_type text default null,
  p_category_id uuid default null,
  p_member_id uuid default null,
  p_unassigned boolean default false,
  p_query text default null,
  p_min_amount_cents bigint default null,
  p_max_amount_cents bigint default null,
  p_sort text default 'date',
  p_desc boolean default true,
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with filtered as materialized (
    select t.*
    from public.transactions t
    where t.household_id = p_household_id
      and (p_from is null or t.date >= p_from)
      and (p_to is null or t.date <= p_to)
      and (p_type is null or t.type = p_type)
      and (p_category_id is null or t.category_id = p_category_id)
      and (not p_unassigned or t.family_member_id is null)
      and (p_member_id is null or t.family_member_id = p_member_id)
      and (p_min_amount_cents is null or t.amount_cents >= p_min_amount_cents)
      and (p_max_amount_cents is null or t.amount_cents <= p_max_amount_cents)
      and (
        p_query is null or btrim(p_query) = ''
        or t.description ilike '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
        or t.note ilike '%' || replace(replace(replace(p_query, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
      )
  ),
  page_rows as (
    select row_number() over () as sort_position, ordered.*
    from (
      select t.*
      from filtered t
      order by
        case when p_sort = 'amount' and not p_desc then t.amount_cents end asc,
        case when p_sort = 'amount' and p_desc then t.amount_cents end desc,
        case when p_sort = 'description' and not p_desc then lower(t.description) end asc,
        case when p_sort = 'description' and p_desc then lower(t.description) end desc,
        case when p_sort = 'date' and not p_desc then t.date end asc,
        case when p_sort = 'date' and p_desc then t.date end desc,
        t.id desc
      limit least(greatest(coalesce(p_limit, 20), 1), 100)
      offset greatest(coalesce(p_offset, 0), 0)
    ) ordered
  ),
  totals as (
    select count(*) as total,
      coalesce(sum(amount_cents) filter (where type = 'ingreso'), 0) as income_cents,
      coalesce(sum(amount_cents) filter (where type = 'gasto'), 0) as expense_cents
    from filtered
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(to_jsonb(p) - 'sort_position' order by p.sort_position) from page_rows p), '[]'::jsonb),
    'total', totals.total,
    'income_cents', totals.income_cents,
    'expense_cents', totals.expense_cents
  )
  from totals;
$$;

revoke all on function public.get_transactions_page(uuid, date, date, text, uuid, uuid, boolean, text, bigint, bigint, text, boolean, integer, integer) from public;
grant execute on function public.get_transactions_page(uuid, date, date, text, uuid, uuid, boolean, text, bigint, bigint, text, boolean, integer, integer) to authenticated;

-- Cover the filters that are not handled by the initial schema's date indexes.
create index if not exists expenses_household_category_date_idx on public.expenses (household_id, category_id, occurred_on desc);
create index if not exists incomes_household_category_date_idx on public.incomes (household_id, category_id, occurred_on desc);
create index if not exists expenses_household_member_date_idx on public.expenses (household_id, family_member_id, occurred_on desc);
create index if not exists incomes_household_member_date_idx on public.incomes (household_id, family_member_id, occurred_on desc);
