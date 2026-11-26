-- Update a movement atomically, including a change between the incomes and
-- expenses tables. The original UUID and creator attribution are preserved.
create or replace function public.update_transaction(
  p_id uuid,
  p_type text,
  p_category_id uuid,
  p_family_member_id uuid,
  p_amount_cents bigint,
  p_description text,
  p_note text,
  p_occurred_on date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  movement_household uuid;
  movement_creator uuid;
  movement_created_at timestamptz;
  old_income public.incomes%rowtype;
  old_expense public.expenses%rowtype;
  old_type text;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_type is null or p_type not in ('ingreso', 'gasto') then
    raise exception 'Invalid movement type' using errcode = '22023';
  end if;
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Amount must be positive' using errcode = '22023';
  end if;
  if p_description is null or char_length(trim(p_description)) not between 1 and 180 then
    raise exception 'Invalid description' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 1000 or p_occurred_on is null then
    raise exception 'Invalid movement details' using errcode = '22023';
  end if;

  select * into old_income from public.incomes where id = p_id for update;
  if found then
    movement_household := old_income.household_id;
    movement_creator := old_income.created_by;
    movement_created_at := old_income.created_at;
    old_type := 'ingreso';
  else
    select * into old_expense from public.expenses where id = p_id for update;
    if not found then
      raise exception 'Movement not found' using errcode = 'P0002';
    end if;
    movement_household := old_expense.household_id;
    movement_creator := old_expense.created_by;
    movement_created_at := old_expense.created_at;
    old_type := 'gasto';
  end if;

  if not public.is_household_member(movement_household)
     or (movement_creator <> actor and not public.can_manage_household(movement_household)) then
    raise exception 'Not allowed to edit this movement' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.categories
    where id = p_category_id and household_id = movement_household
  ) then
    raise exception 'Category does not belong to the household' using errcode = '23503';
  end if;
  if p_family_member_id is not null and not exists (
    select 1 from public.family_members
    where id = p_family_member_id and household_id = movement_household
  ) then
    raise exception 'Family member does not belong to the household' using errcode = '23503';
  end if;

  if old_type = p_type and p_type = 'ingreso' then
    update public.incomes set
      category_id = p_category_id,
      family_member_id = p_family_member_id,
      amount_cents = p_amount_cents,
      description = p_description,
      note = coalesce(p_note, ''),
      occurred_on = p_occurred_on,
      updated_at = now()
    where id = p_id;
  elsif old_type = p_type and p_type = 'gasto' then
    update public.expenses set
      category_id = p_category_id,
      family_member_id = p_family_member_id,
      amount_cents = p_amount_cents,
      description = p_description,
      note = coalesce(p_note, ''),
      occurred_on = p_occurred_on,
      updated_at = now()
    where id = p_id;
  elsif p_type = 'ingreso' then
    insert into public.incomes (id, household_id, category_id, family_member_id, created_by,
      amount_cents, description, note, occurred_on, created_at, updated_at)
    values (p_id, movement_household, p_category_id, p_family_member_id, movement_creator,
      p_amount_cents, p_description, coalesce(p_note, ''), p_occurred_on, movement_created_at, now());
    delete from public.expenses where id = p_id;
  else
    insert into public.expenses (id, household_id, category_id, family_member_id, created_by,
      amount_cents, description, note, occurred_on, created_at, updated_at)
    values (p_id, movement_household, p_category_id, p_family_member_id, movement_creator,
      p_amount_cents, p_description, coalesce(p_note, ''), p_occurred_on, movement_created_at, now());
    delete from public.incomes where id = p_id;
  end if;
end;
$$;

revoke all on function public.update_transaction(uuid, text, uuid, uuid, bigint, text, text, date) from public;
grant execute on function public.update_transaction(uuid, text, uuid, uuid, bigint, text, text, date) to authenticated;
