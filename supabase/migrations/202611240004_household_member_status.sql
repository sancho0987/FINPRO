alter table public.household_members add column is_active boolean not null default true;

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid()) and hm.is_active
  );
$$;

create or replace function public.can_manage_household(target_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid())
      and hm.role in ('owner','admin') and hm.is_active
  );
$$;

create or replace function public.can_manage_user(target_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members mine
    join public.household_members theirs on theirs.household_id = mine.household_id
    where mine.user_id = (select auth.uid()) and mine.role in ('owner','admin') and mine.is_active
      and theirs.user_id = target_user
  );
$$;

create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  current_household uuid;
  current_role text;
  next_owner uuid;
begin
  if (select auth.uid()) is null then raise exception 'Authentication required'; end if;
  select household_id, role into current_household, current_role
    from public.household_members where user_id = (select auth.uid());
  if current_role = 'owner' then
    select user_id into next_owner from public.household_members
      where household_id = current_household and user_id <> (select auth.uid()) and is_active
      order by joined_at, user_id limit 1;
    if next_owner is null then delete from public.households where id = current_household;
    else update public.household_members set role = 'owner' where household_id = current_household and user_id = next_owner;
    end if;
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
