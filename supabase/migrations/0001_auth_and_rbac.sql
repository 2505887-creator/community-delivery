-- Align Supabase Auth with the Prisma-backed application tables.
-- The original domain migration uses Prisma's quoted table names, while the
-- client-facing auth profile remains a normal lowercase `profiles` table.

create table if not exists public.profiles (
  id text primary key,
  email text not null,
  name text,
  role "UserRole" not null default 'tenant',
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
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
security definer set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, ''), "updatedAt" = now() where id = new.id::text;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute procedure public.handle_user_email_update();
