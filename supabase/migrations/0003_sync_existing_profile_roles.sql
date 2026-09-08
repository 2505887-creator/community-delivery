-- ============================================================
-- OmniServe Existing Profile Synchronization
-- ============================================================
--
-- Synchronizes existing profiles with Supabase Auth metadata.
--
-- SECURITY:
-- Admin is NEVER granted through user metadata.
-- ============================================================

update public.profiles p

set

  email =
    coalesce(
      u.email,
      p.email
    ),

  name =
    coalesce(
      nullif(
        u.raw_user_meta_data ->> 'name',
        ''
      ),
      p.name
    ),

  role =
    case

      when
        u.raw_user_meta_data ->> 'role'
        in (
          'tenant',
          'provider',
          'driver',
          'merchant'
        )

      then
        (
          u.raw_user_meta_data ->> 'role'
        )::"UserRole"

      else
        p.role

    end,

  "updatedAt" =
    now()

from auth.users u

where
  p.id = u.id::text;