-- ============================================================
-- migration_barber_profile.sql
-- Run in Supabase SQL Editor
-- Adds per-barber avatar and brand color to profiles
-- ============================================================

-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#C9A84C';

-- 2. Rebuild public_get_shop to include barber avatar + color
DROP FUNCTION IF EXISTS public.public_get_shop(TEXT);
CREATE OR REPLACE FUNCTION public.public_get_shop(shop_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop      JSONB;
  v_services  JSONB;
  v_schedules JSONB;
  v_blocked   JSONB;
  v_barbers   JSONB;
BEGIN
  SELECT to_jsonb(b) INTO v_shop
  FROM public.barbershops b
  WHERE b.slug = shop_slug AND b.is_active = TRUE;

  IF v_shop IS NULL THEN
    RETURN jsonb_build_object('error', 'Barbería no encontrada');
  END IF;

  SELECT COALESCE(jsonb_agg(s ORDER BY s.name), '[]'::jsonb) INTO v_services
  FROM public.services s
  WHERE s.barbershop_id = (v_shop->>'id')::UUID AND s.is_active = TRUE;

  SELECT COALESCE(jsonb_agg(sc ORDER BY sc.weekday), '[]'::jsonb) INTO v_schedules
  FROM public.schedules sc
  WHERE sc.barbershop_id = (v_shop->>'id')::UUID;

  SELECT COALESCE(jsonb_agg(bd ORDER BY bd.blocked_date), '[]'::jsonb) INTO v_blocked
  FROM public.blocked_dates bd
  WHERE bd.barbershop_id = (v_shop->>'id')::UUID
    AND bd.blocked_date >= CURRENT_DATE;

  IF (v_shop->>'plan_type') = 'equipo' THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',          p.id,
        'full_name',   p.full_name,
        'avatar_url',  p.avatar_url,
        'brand_color', p.brand_color
      ) ORDER BY p.created_at
    ), '[]'::jsonb) INTO v_barbers
    FROM public.profiles p
    WHERE p.barbershop_id = (v_shop->>'id')::UUID
      AND p.role = 'barber';
  ELSE
    v_barbers := '[]'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'barbershop',    v_shop,
    'services',      v_services,
    'schedules',     v_schedules,
    'blocked_dates', v_blocked,
    'barbers',       v_barbers
  );
END;
$$;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
