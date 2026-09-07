-- OmniServe profile/RLS hardening.
-- Run this migration in the Supabase project that serves the frontend.

create table if not exists public.profiles (
  id text primary key,
  email text not null,
  name text,
  role "UserRole" not null default 'tenant',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- PostgREST needs table privileges in addition to RLS policies.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update on public.profiles to authenticated;

-- A signed-in user may read only their own profile. The application does not
-- need a public profiles directory for authentication.
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid()::text = id);

-- This supports repair of profiles for Auth users created before the trigger
-- existed. Role creation is intentionally limited to self-service roles;
-- admin assignment remains a server/Supabase-admin operation.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (
  auth.uid()::text = id
  and role in ('tenant', 'provider', 'driver', 'merchant')
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid()::text = id)
with check (auth.uid()::text = id);

-- Keep the Auth -> profile trigger in sync for new accounts and email changes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role "UserRole";
begin
  begin
    safe_role := requested_role::"UserRole";
  exception when others then
    safe_role := 'tenant';
  end;

  if safe_role = 'admin' then
    safe_role := 'tenant';
  end if;

  insert into public.profiles (id, email, name, role)
  values (new.id::text, coalesce(new.email, ''), new.raw_user_meta_data ->> 'name', safe_role)
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    "updatedAt" = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set email = coalesce(new.email, ''), "updatedAt" = now()
  where id = new.id::text;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.handle_user_email_update();
