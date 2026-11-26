alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;
create unique index profiles_email_lower_uidx on public.profiles (lower(email)) where email is not null;

create or replace function public.sync_auth_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger sync_auth_profile_after_insert
  after insert on auth.users for each row execute procedure public.sync_auth_profile();
create trigger sync_auth_profile_after_email_update
  after update of email on auth.users for each row execute procedure public.sync_auth_profile();
