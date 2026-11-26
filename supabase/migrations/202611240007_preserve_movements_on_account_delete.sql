-- Preconditions: migration 001's incomes_household_id_fkey and
-- expenses_household_id_fkey must still reference households(id) from
-- household_id. Confirm the exact production definitions with the read-only
-- preflight before applying this migration to an existing project.
-- Prevent household deletion by cascade while movements reference it.
alter table public.incomes drop constraint incomes_household_id_fkey;
alter table public.incomes
  add constraint incomes_household_id_fkey
  foreign key (household_id) references public.households(id) on delete restrict;

alter table public.expenses drop constraint expenses_household_id_fkey;
alter table public.expenses
  add constraint expenses_household_id_fkey
  foreign key (household_id) references public.households(id) on delete restrict;

-- Preserve author attribution and all household configuration. The account
-- cannot be deleted when it authored movements, or when it is the last active
-- member (including an otherwise-empty household). This intentionally avoids
-- cascading deletion of categories, budgets, members, or other memberships.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  current_household uuid;
  current_role text;
  next_owner uuid;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if exists (select 1 from public.incomes where created_by = actor)
     or exists (select 1 from public.expenses where created_by = actor) then
    raise exception 'Account has attributed movements' using errcode = '55000';
  end if;

  select household_id, role into current_household, current_role
    from public.household_members
    where user_id = actor and is_active
    for update;
  if current_household is null then
    raise exception 'Active household membership required' using errcode = '42501';
  end if;

  select user_id into next_owner from public.household_members
    where household_id = current_household and user_id <> actor and is_active
    order by case when role = 'admin' then 0 else 1 end, joined_at, user_id
    limit 1 for update;

  if next_owner is null then
    raise exception 'Last active household member cannot leave without a successor' using errcode = '55000';
  end if;

  if current_role = 'owner' then
    update public.household_members set role = 'owner'
      where household_id = current_household and user_id = next_owner;
  end if;

  delete from auth.users where id = actor;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
