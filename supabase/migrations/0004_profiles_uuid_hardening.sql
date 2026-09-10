-- Keep the Supabase-managed profile identity compatible with Prisma.
-- Supabase auth.users.id is UUID, so public.profiles.id must be UUID too.

DO $$
DECLARE invalid_count integer;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM public.profiles
  WHERE id IS NOT NULL
    AND id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Cannot migrate public.profiles.id to UUID: % invalid row(s) found.', invalid_count;
  END IF;
END $$;

ALTER TABLE public.profiles
  ALTER COLUMN id TYPE uuid USING id::uuid;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS "avatarUrl" text,
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" timestamptz,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Nairobi',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS "suspendedAt" timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := new.raw_user_meta_data ->> 'role';
  safe_role "UserRole" := 'tenant';
BEGIN
  BEGIN
    IF requested_role IN ('tenant', 'provider', 'driver', 'merchant') THEN
      safe_role := requested_role::"UserRole";
    END IF;
  EXCEPTION WHEN others THEN
    safe_role := 'tenant';
  END;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'name', safe_role)
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    name = coalesce(excluded.name, public.profiles.name),
    "updatedAt" = now();

  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = coalesce(new.email, ''), "updatedAt" = now()
  WHERE id = new.id;
  RETURN new;
END;
$$;


DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
ON public.profiles
FOR SELECT
USING (true);

-- Backfill profiles for existing Supabase Auth users that do not yet have one.
INSERT INTO public.profiles (id, email, name, role)
SELECT
  u.id,
  coalesce(u.email, ''),
  nullif(u.raw_user_meta_data ->> 'name', ''),
  CASE
    WHEN u.raw_user_meta_data ->> 'role' IN ('tenant', 'provider', 'driver', 'merchant')
      THEN (u.raw_user_meta_data ->> 'role')::"UserRole"
    ELSE 'tenant'::"UserRole"
  END
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
