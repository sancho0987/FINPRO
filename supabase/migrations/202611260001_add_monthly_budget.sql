-- Keep Supabase settings aligned with the existing SQLite monthly budget.
-- Zero means that the current period uses the sum of category budgets instead.
alter table public.households
  add column if not exists monthly_budget_cents bigint not null default 0
  check (monthly_budget_cents >= 0);

-- The reset RPC must restore the new setting alongside the existing defaults.
create or replace function public.wipe_own_household()
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_household uuid;
begin
  select household_id into current_household
    from public.household_members
    where user_id = (select auth.uid()) and is_active and role in ('owner', 'admin')
    for update;

  if current_household is null then
    raise exception 'Household manager required' using errcode = '42501';
  end if;

  delete from public.expenses where household_id = current_household;
  delete from public.incomes where household_id = current_household;
  delete from public.budgets where household_id = current_household;
  delete from public.family_members where household_id = current_household;
  delete from public.categories where household_id = current_household;

  insert into public.categories (household_id, name, emoji, color, is_ant, sort_order) values
    (current_household, 'Alimentación', '🍽️', '#4fd1a5', false, 0),
    (current_household, 'Transporte', '🚌', '#6b9fff', false, 1),
    (current_household, 'Vivienda', '🏠', '#a78bfa', false, 2),
    (current_household, 'Salud', '💊', '#f07070', false, 3),
    (current_household, 'Educación', '📚', '#f0b84a', false, 4),
    (current_household, 'Entretenimiento', '🎬', '#f472b6', false, 5),
    (current_household, 'Ropa', '👗', '#38bdf8', false, 6),
    (current_household, 'Servicios', '💡', '#fb923c', false, 7),
    (current_household, 'Gastos Hormiga', '🐜', '#94a3b8', true, 8),
    (current_household, 'Otros', '📦', '#64748b', false, 9),
    (current_household, 'Ingresos', '💰', '#34d399', false, 10);

  update public.households
    set name = 'Mi Familia', currency = 'COP', cutoff_day = 1, alert_pct = 80,
        ant_limit_cents = 3000000, monthly_budget_cents = 0
    where id = current_household;
end;
$$;

revoke all on function public.wipe_own_household() from public;
grant execute on function public.wipe_own_household() to authenticated;
