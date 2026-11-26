-- Members can read the household but only manage their own movements.
-- Owners and admins manage shared configuration and every household movement.
-- Household and creator attribution are immutable after a movement is inserted.
create or replace function public.prevent_movement_household_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.household_id is distinct from old.household_id then
    raise exception 'A movement cannot be moved between households' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_movement_household_change() from public;

create or replace function public.prevent_movement_attribution_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'Movement creator attribution cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_movement_attribution_change() from public;

drop trigger if exists incomes_prevent_household_change on public.incomes;
create trigger incomes_prevent_household_change
  before update of household_id on public.incomes
  for each row execute function public.prevent_movement_household_change();

drop trigger if exists expenses_prevent_household_change on public.expenses;
create trigger expenses_prevent_household_change
  before update of household_id on public.expenses
  for each row execute function public.prevent_movement_household_change();

drop trigger if exists incomes_prevent_attribution_change on public.incomes;
create trigger incomes_prevent_attribution_change
  before update of created_by on public.incomes
  for each row execute function public.prevent_movement_attribution_change();

drop trigger if exists expenses_prevent_attribution_change on public.expenses;
create trigger expenses_prevent_attribution_change
  before update of created_by on public.expenses
  for each row execute function public.prevent_movement_attribution_change();

drop policy if exists "household_members_manage_admin" on public.household_members;
revoke insert, update, delete on public.household_members from authenticated;
grant select on public.household_members to authenticated;

drop policy if exists "family_members_manage_group" on public.family_members;
create policy "family_members_manage_admin" on public.family_members
  for all to authenticated
  using (public.can_manage_household(household_id))
  with check (public.can_manage_household(household_id));

drop policy if exists "categories_manage_group" on public.categories;
create policy "categories_manage_admin" on public.categories
  for all to authenticated
  using (public.can_manage_household(household_id))
  with check (public.can_manage_household(household_id));

drop policy if exists "incomes_insert_group" on public.incomes;
create policy "incomes_insert_member" on public.incomes
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = (select auth.uid()));
drop policy if exists "incomes_update_group" on public.incomes;
create policy "incomes_update_own_or_admin" on public.incomes
  for update to authenticated
  using (public.is_household_member(household_id) and (created_by = (select auth.uid()) or public.can_manage_household(household_id)))
  with check (public.is_household_member(household_id)
    and (created_by = (select auth.uid()) or public.can_manage_household(household_id)));
drop policy if exists "incomes_delete_group" on public.incomes;
create policy "incomes_delete_own_or_admin" on public.incomes
  for delete to authenticated
  using (public.is_household_member(household_id) and (created_by = (select auth.uid()) or public.can_manage_household(household_id)));

drop policy if exists "expenses_insert_group" on public.expenses;
create policy "expenses_insert_member" on public.expenses
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = (select auth.uid()));
drop policy if exists "expenses_update_group" on public.expenses;
create policy "expenses_update_own_or_admin" on public.expenses
  for update to authenticated
  using (public.is_household_member(household_id) and (created_by = (select auth.uid()) or public.can_manage_household(household_id)))
  with check (public.is_household_member(household_id)
    and (created_by = (select auth.uid()) or public.can_manage_household(household_id)));
drop policy if exists "expenses_delete_group" on public.expenses;
create policy "expenses_delete_own_or_admin" on public.expenses
  for delete to authenticated
  using (public.is_household_member(household_id) and (created_by = (select auth.uid()) or public.can_manage_household(household_id)));

drop policy if exists "budgets_manage_group" on public.budgets;
create policy "budgets_manage_admin" on public.budgets
  for all to authenticated
  using (public.can_manage_household(household_id))
  with check (public.can_manage_household(household_id));

-- Membership changes are routed through this function so an admin cannot
-- promote themselves, take ownership, or change/remove another admin or owner.
create or replace function public.manage_household_member(
  p_household_id uuid,
  p_user_id uuid,
  p_role text default null,
  p_is_active boolean default null,
  p_remove boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role text;
  target_role text;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select role into actor_role from public.household_members
    where household_id = p_household_id and user_id = actor and is_active
    for update;
  if actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Household manager required' using errcode = '42501';
  end if;
  if p_user_id = actor then
    raise exception 'Managers cannot change their own membership here' using errcode = '42501';
  end if;

  select role into target_role from public.household_members
    where household_id = p_household_id and user_id = p_user_id
    for update;
  if target_role is null then
    raise exception 'Household member not found' using errcode = 'P0002';
  end if;
  if target_role = 'owner' then
    raise exception 'Ownership transfer must use a dedicated flow' using errcode = '42501';
  end if;
  if actor_role = 'admin' and target_role = 'admin' then
    raise exception 'Only the owner can manage administrators' using errcode = '42501';
  end if;
  if actor_role = 'admin' and p_role = 'admin' then
    raise exception 'Only the owner can promote administrators' using errcode = '42501';
  end if;
  if p_role is not null and p_role not in ('admin', 'member') then
    raise exception 'Invalid household role' using errcode = '22023';
  end if;
  if p_remove then
    delete from public.household_members
      where household_id = p_household_id and user_id = p_user_id;
    return;
  end if;
  if p_role is null and p_is_active is null then
    raise exception 'No membership changes supplied' using errcode = '22023';
  end if;

  update public.household_members set
    role = coalesce(p_role, role),
    is_active = coalesce(p_is_active, is_active)
  where household_id = p_household_id and user_id = p_user_id;
end;
$$;

revoke all on function public.manage_household_member(uuid, uuid, text, boolean, boolean) from public;
grant execute on function public.manage_household_member(uuid, uuid, text, boolean, boolean) to authenticated;
