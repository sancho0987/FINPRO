-- FINPRO household data model for Supabase (PostgreSQL + Supabase Auth).
-- Apply with `supabase db push` or the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi Familia' check (char_length(trim(name)) between 1 and 100),
  currency text not null default 'COP' check (currency in ('COP','USD','EUR','MXN','ARS')),
  cutoff_day smallint not null default 1 check (cutoff_day between 1 and 28),
  alert_pct smallint not null default 80 check (alert_pct between 50 and 100),
  ant_limit_cents bigint not null default 3000000 check (ant_limit_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  unique (user_id)
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  role text not null default 'Adulto' check (role in ('Titular','Adulto','Joven','Niño','Otro')),
  emoji text not null default '👤',
  color text not null default '#4fd1a5' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, household_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  emoji text not null default '📦',
  color text not null default '#64748b' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_ant boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, name),
  unique (id, household_id)
);

create table public.incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null,
  family_member_id uuid,
  created_by uuid not null default auth.uid() references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  description text not null check (char_length(trim(description)) between 1 and 180),
  note text not null default '' check (char_length(note) <= 1000),
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, household_id) references public.categories(id, household_id) on delete restrict,
  foreign key (family_member_id, household_id) references public.family_members(id, household_id) on delete set null (family_member_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null,
  family_member_id uuid,
  created_by uuid not null default auth.uid() references public.profiles(id),
  amount_cents bigint not null check (amount_cents > 0),
  description text not null check (char_length(trim(description)) between 1 and 180),
  note text not null default '' check (char_length(note) <= 1000),
  occurred_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, household_id) references public.categories(id, household_id) on delete restrict,
  foreign key (family_member_id, household_id) references public.family_members(id, household_id) on delete set null (family_member_id)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid,
  period_start date not null,
  amount_cents bigint not null check (amount_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, household_id) references public.categories(id, household_id) on delete cascade,
  unique nulls not distinct (household_id, category_id, period_start)
);

create index expenses_household_date_idx on public.expenses (household_id, occurred_on desc);
create index expenses_household_category_idx on public.expenses (household_id, category_id);
create index incomes_household_date_idx on public.incomes (household_id, occurred_on desc);
create index budgets_household_period_idx on public.budgets (household_id, period_start);

-- SECURITY DEFINER membership predicates avoid recursive RLS evaluation.
create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_household(target_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.household_members hm
    where hm.household_id = target_household and hm.user_id = (select auth.uid())
      and hm.role in ('owner','admin')
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.can_manage_household(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.can_manage_household(uuid) to authenticated;

-- New auth users receive a private household, profile and standard categories.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  new_household uuid;
  display_name text;
begin
  display_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, full_name) values (new.id, display_name);
  insert into public.households (name) values (display_name || ' — Mi Familia') returning id into new_household;
  insert into public.household_members (household_id, user_id, role) values (new_household, new.id, 'owner');
  insert into public.categories (household_id, name, emoji, color, is_ant, sort_order) values
    (new_household, 'Alimentación', '🍽️', '#4fd1a5', false, 0),
    (new_household, 'Transporte', '🚌', '#6b9fff', false, 1),
    (new_household, 'Vivienda', '🏠', '#a78bfa', false, 2),
    (new_household, 'Salud', '💊', '#f07070', false, 3),
    (new_household, 'Educación', '📚', '#f0b84a', false, 4),
    (new_household, 'Entretenimiento', '🎬', '#f472b6', false, 5),
    (new_household, 'Gastos Hormiga', '🐜', '#94a3b8', true, 6),
    (new_household, 'Otros', '📦', '#64748b', false, 7),
    (new_household, 'Ingresos', '💰', '#34d399', false, 8);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.family_members enable row level security;
alter table public.categories enable row level security;
alter table public.incomes enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

create policy "profiles_read_self" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "households_read_member" on public.households for select to authenticated using (public.is_household_member(id));
create policy "households_update_managers" on public.households for update to authenticated using (public.can_manage_household(id)) with check (public.can_manage_household(id));

create policy "household_members_read_group" on public.household_members for select to authenticated using (public.is_household_member(household_id));
create policy "household_members_manage_admin" on public.household_members for all to authenticated using (public.can_manage_household(household_id)) with check (public.can_manage_household(household_id));

create policy "family_members_read_group" on public.family_members for select to authenticated using (public.is_household_member(household_id));
create policy "family_members_manage_group" on public.family_members for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "categories_read_group" on public.categories for select to authenticated using (public.is_household_member(household_id));
create policy "categories_manage_group" on public.categories for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "incomes_read_group" on public.incomes for select to authenticated using (public.is_household_member(household_id));
create policy "incomes_insert_group" on public.incomes for insert to authenticated with check (public.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "incomes_update_group" on public.incomes for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "incomes_delete_group" on public.incomes for delete to authenticated using (public.is_household_member(household_id));

create policy "expenses_read_group" on public.expenses for select to authenticated using (public.is_household_member(household_id));
create policy "expenses_insert_group" on public.expenses for insert to authenticated with check (public.is_household_member(household_id) and created_by = (select auth.uid()));
create policy "expenses_update_group" on public.expenses for update to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy "expenses_delete_group" on public.expenses for delete to authenticated using (public.is_household_member(household_id));

create policy "budgets_read_group" on public.budgets for select to authenticated using (public.is_household_member(household_id));
create policy "budgets_manage_group" on public.budgets for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

grant select, update on public.profiles to authenticated;
grant select, update on public.households to authenticated;
grant select, insert, update, delete on public.household_members, public.family_members, public.categories,
  public.incomes, public.expenses, public.budgets to authenticated;
