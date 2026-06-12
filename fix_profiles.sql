-- ============================================================
-- fix_profiles.sql
-- Run this in Supabase SQL Editor to fix the login issue
-- ============================================================

-- Step 1: Diagnostic — check what exists
DO $$
DECLARE
  v_admin_id   UUID;
  v_profile    RECORD;
  v_policy_ok  BOOLEAN;
BEGIN
  -- Check auth user
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE email = 'admin@hggrowthlab.cl';

  IF v_admin_id IS NULL THEN
    RAISE NOTICE '[PROBLEMA] El usuario admin@hggrowthlab.cl NO existe en auth.users. Debes crearlo en Supabase > Authentication > Users.';
    RETURN;
  ELSE
    RAISE NOTICE '[OK] auth.users: admin@hggrowthlab.cl encontrado, id = %', v_admin_id;
  END IF;

  -- Check profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_admin_id;

  IF v_profile IS NULL THEN
    RAISE NOTICE '[PROBLEMA] No existe perfil en public.profiles para este usuario. Creando ahora...';

    INSERT INTO public.profiles (id, full_name, role, barbershop_id)
    VALUES (v_admin_id, 'Super Admin', 'super_admin', NULL);

    RAISE NOTICE '[SOLUCIONADO] Perfil super_admin creado para admin@hggrowthlab.cl';
  ELSE
    RAISE NOTICE '[OK] public.profiles: encontrado — role = %, barbershop_id = %',
      v_profile.role, v_profile.barbershop_id;
  END IF;

  -- Check RLS policy exists
  SELECT EXISTS(
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Users can read own profile'
  ) INTO v_policy_ok;

  IF v_policy_ok THEN
    RAISE NOTICE '[OK] RLS policy "Users can read own profile" existe.';
  ELSE
    RAISE NOTICE '[PROBLEMA] RLS policy faltante — recreando...';
  END IF;
END;
$$;

-- Step 2: Ensure the correct RLS policies exist on profiles
DROP POLICY IF EXISTS "Users can read own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Barbers can read same-shop profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admin can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin');

-- Allows barbers in equipo shops to see their teammates
CREATE POLICY "Barbers can read same-shop profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

-- Step 3: Also recreate helper functions just in case they got corrupted
CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT barbershop_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Step 4: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 5: Final verification
SELECT
  u.email,
  p.id,
  p.role,
  p.barbershop_id,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'admin@hggrowthlab.cl'
);
