-- A user may participate in more than one household. Existing memberships are
-- preserved; the application selects one active household per browser session.
alter table public.household_members drop constraint household_members_user_id_key;

create table public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null check (char_length(trim(email)) between 3 and 254),
  role text not null check (role in ('admin', 'member')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index household_invitations_household_created_idx
  on public.household_invitations (household_id, created_at desc);
create index household_invitations_email_idx
  on public.household_invitations (lower(email));
create unique index household_invitations_one_pending_email_idx
  on public.household_invitations (household_id, lower(email))
  where accepted_at is null and revoked_at is null;

alter table public.household_invitations enable row level security;
create policy "household_invitations_read_admin" on public.household_invitations
  for select to authenticated using (public.can_manage_household(household_id));
revoke all on public.household_invitations from public;
grant select on public.household_invitations to authenticated;

create or replace function public.create_household_invitation(
  p_household_id uuid,
  p_email text,
  p_role text,
  p_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role text;
  invitation_id uuid;
  normalized_email text := lower(trim(p_email));
begin
  select role into actor_role from public.household_members
    where household_id = p_household_id and user_id = actor and is_active for update;
  if actor is null or actor_role is null or actor_role not in ('owner', 'admin') then
    raise exception 'Household manager required' using errcode = '42501';
  end if;
  if p_role is null or p_role not in ('admin', 'member') then
    raise exception 'Invalid invitation role' using errcode = '22023';
  end if;
  if actor_role <> 'owner' and p_role = 'admin' then
    raise exception 'Only the owner can invite an administrator' using errcode = '42501';
  end if;
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation details' using errcode = '22023';
  end if;

  update public.household_invitations set revoked_at = now()
    where household_id = p_household_id and lower(email) = normalized_email
      and accepted_at is null and revoked_at is null;

  insert into public.household_invitations (household_id, email, role, token_hash, created_by, expires_at)
    values (p_household_id, normalized_email, p_role, p_token_hash, actor, now() + interval '7 days')
    returning id into invitation_id;
  return invitation_id;
end;
$$;

create or replace function public.revoke_household_invitation(p_household_id uuid, p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is null or not public.can_manage_household(p_household_id) then
    raise exception 'Household manager required' using errcode = '42501';
  end if;
  update public.household_invitations set revoked_at = now()
    where id = p_invitation_id and household_id = p_household_id
      and accepted_at is null and revoked_at is null;
  if not found then
    raise exception 'Invitation not found or already used' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.accept_household_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  account_email text;
  email_confirmed timestamptz;
  invitation public.household_invitations%rowtype;
begin
  if actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select lower(email), email_confirmed_at into account_email, email_confirmed
    from auth.users where id = actor;
  if account_email is null or email_confirmed is null then
    raise exception 'Confirmed email required' using errcode = '42501';
  end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation token' using errcode = '22023';
  end if;

  select * into invitation from public.household_invitations
    where token_hash = p_token_hash for update;
  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if invitation.accepted_at is not null then
    if invitation.accepted_by = actor then return invitation.household_id; end if;
    raise exception 'Invitation already used' using errcode = '55000';
  end if;
  if invitation.revoked_at is not null or invitation.expires_at <= now() then
    raise exception 'Invitation expired or revoked' using errcode = '55000';
  end if;
  if invitation.email <> account_email then
    raise exception 'Invitation email does not match authenticated account' using errcode = '42501';
  end if;
  perform 1 from public.household_members
    where household_id = invitation.household_id and user_id = actor for update;
  if found then
    if exists (select 1 from public.household_members
        where household_id = invitation.household_id and user_id = actor and is_active) then
      raise exception 'Account is already a household member' using errcode = '23505';
    end if;
    update public.household_members set role = invitation.role, is_active = true
      where household_id = invitation.household_id and user_id = actor;
  else
    insert into public.household_members (household_id, user_id, role, is_active)
      values (invitation.household_id, actor, invitation.role, true);
  end if;
  update public.household_invitations set accepted_at = now(), accepted_by = actor
    where id = invitation.id;
  return invitation.household_id;
end;
$$;

revoke all on function public.create_household_invitation(uuid, text, text, text) from public;
revoke all on function public.revoke_household_invitation(uuid, uuid) from public;
revoke all on function public.accept_household_invitation(text) from public;
grant execute on function public.create_household_invitation(uuid, text, text, text) to authenticated;
grant execute on function public.revoke_household_invitation(uuid, uuid) to authenticated;
grant execute on function public.accept_household_invitation(text) to authenticated;
