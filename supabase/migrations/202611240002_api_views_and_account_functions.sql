-- Read-only unified movement view used by the FINPRO API.
create or replace view public.transactions
with (security_invoker = true)
as
  select id, household_id, category_id, family_member_id, created_by,
         'ingreso'::text as type, amount_cents, description, note,
         occurred_on as date, created_at, updated_at
  from public.incomes
  union all
  select id, household_id, category_id, family_member_id, created_by,
         'gasto'::text as type, amount_cents, description, note,
         occurred_on as date, created_at, updated_at
  from public.expenses;

grant select on public.transactions to authenticated;

create or replace function public.can_manage_user(target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members mine
    join public.household_members theirs on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid())
      and mine.role in ('owner','admin')
      and theirs.user_id = target_user
  );
$$;
revoke all on function public.can_manage_user(uuid) from public;
grant execute on function public.can_manage_user(uuid) to authenticated;

create policy "profiles_read_household_managers" on public.profiles
  for select to authenticated using (public.can_manage_user(id));

create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_household uuid;
  current_role text;
  next_owner uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  select household_id, role into current_household, current_role
    from public.household_members where user_id = (select auth.uid());
  if current_role = 'owner' then
    select user_id into next_owner from public.household_members
      where household_id = current_household and user_id <> (select auth.uid())
      order by joined_at, user_id limit 1;
    if next_owner is null then
      delete from public.households where id = current_household;
    else
      update public.household_members set role = 'owner'
        where household_id = current_household and user_id = next_owner;
    end if;
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
