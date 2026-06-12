-- ============================================================
-- Migration: Plan Full Equipo (multi-barbero)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add plan_type and max_barberos to barbershops
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (plan_type IN ('individual', 'equipo')),
  ADD COLUMN IF NOT EXISTS max_barberos INTEGER NOT NULL DEFAULT 1;

-- 2. Add barber_id to schedules (nullable = backward compat with existing shops)
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Drop old unique constraint that only allowed one schedule per (shop, weekday)
ALTER TABLE public.schedules
  DROP CONSTRAINT IF EXISTS schedules_barbershop_id_weekday_key;

-- New partial indexes: one schedule per weekday per shop (individual plan)
-- and one per (shop, barber, weekday) for team plans
CREATE UNIQUE INDEX IF NOT EXISTS schedules_shop_weekday_no_barber_idx
  ON public.schedules(barbershop_id, weekday)
  WHERE barber_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS schedules_shop_barber_weekday_idx
  ON public.schedules(barbershop_id, barber_id, weekday)
  WHERE barber_id IS NOT NULL;

-- 3. Add barber_id to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for filtering appointments by barber
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id ON public.appointments(barber_id);

-- ============================================================
-- 4. Update public_get_shop RPC to return barbers + plan_type
-- ============================================================
DROP FUNCTION IF EXISTS public.public_get_shop(TEXT);
CREATE OR REPLACE FUNCTION public.public_get_shop(shop_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop        JSONB;
  v_services    JSONB;
  v_schedules   JSONB;
  v_blocked     JSONB;
  v_barbers     JSONB;
BEGIN
  -- Fetch barbershop
  SELECT to_jsonb(b) INTO v_shop
  FROM public.barbershops b
  WHERE b.slug = shop_slug AND b.is_active = TRUE;

  IF v_shop IS NULL THEN
    RETURN NULL;
  END IF;

  -- Active services
  SELECT COALESCE(jsonb_agg(s ORDER BY s.created_at), '[]'::jsonb) INTO v_services
  FROM public.services s
  WHERE s.barbershop_id = (v_shop->>'id')::UUID AND s.is_active = TRUE;

  -- Schedules (individual shops: barber_id IS NULL; equipo: all barber schedules)
  SELECT COALESCE(jsonb_agg(sc ORDER BY sc.weekday), '[]'::jsonb) INTO v_schedules
  FROM public.schedules sc
  WHERE sc.barbershop_id = (v_shop->>'id')::UUID AND sc.is_active = TRUE;

  -- Blocked dates (future only)
  SELECT COALESCE(jsonb_agg(bd ORDER BY bd.blocked_date), '[]'::jsonb) INTO v_blocked
  FROM public.blocked_dates bd
  WHERE bd.barbershop_id = (v_shop->>'id')::UUID
    AND bd.blocked_date >= CURRENT_DATE;

  -- Barbers (only for equipo plan; returns active barbers with their profile id)
  IF (v_shop->>'plan_type') = 'equipo' THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',        p.id,
        'full_name', p.full_name
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

-- ============================================================
-- 5. Update public_get_taken_slots to accept optional barber_id
-- ============================================================
DROP FUNCTION IF EXISTS public.public_get_taken_slots(TEXT, DATE);
DROP FUNCTION IF EXISTS public.public_get_taken_slots(TEXT, DATE, UUID);
CREATE OR REPLACE FUNCTION public.public_get_taken_slots(
  shop_slug   TEXT,
  the_date    DATE,
  p_barber_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop_id UUID;
  v_slots   JSONB;
BEGIN
  SELECT id INTO v_shop_id
  FROM public.barbershops
  WHERE slug = shop_slug AND is_active = TRUE;

  IF v_shop_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object('start_time', a.start_time)
    ORDER BY a.start_time
  ), '[]'::jsonb) INTO v_slots
  FROM public.appointments a
  WHERE a.barbershop_id = v_shop_id
    AND a.appointment_date = the_date
    AND a.status != 'cancelada'
    -- If barber_id provided, filter to that barber; otherwise show all (individual shop)
    AND (p_barber_id IS NULL OR a.barber_id = p_barber_id);

  RETURN v_slots;
END;
$$;

-- ============================================================
-- 6. Update public_create_appointment to accept optional barber_id
-- ============================================================
DROP FUNCTION IF EXISTS public.public_create_appointment(TEXT, UUID, TEXT, TEXT, DATE, TIME);
DROP FUNCTION IF EXISTS public.public_create_appointment(TEXT, UUID, TEXT, TEXT, DATE, TIME, UUID);
CREATE OR REPLACE FUNCTION public.public_create_appointment(
  shop_slug    TEXT,
  service_id   UUID,
  client_name  TEXT,
  client_phone TEXT,
  date         DATE,
  start_time   TIME,
  p_barber_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_shop    public.barbershops;
  v_service public.services;
  v_appt_id UUID;
BEGIN
  -- Validate shop
  SELECT * INTO v_shop
  FROM public.barbershops
  WHERE slug = shop_slug AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Barbería no encontrada o inactiva');
  END IF;

  -- Validate service belongs to shop
  SELECT * INTO v_service
  FROM public.services
  WHERE id = service_id
    AND barbershop_id = v_shop.id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Servicio no válido');
  END IF;

  -- Check slot is not already taken
  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.barbershop_id = v_shop.id
      AND a.appointment_date = date
      AND a.start_time = public_create_appointment.start_time
      AND a.status != 'cancelada'
      AND (p_barber_id IS NULL OR a.barber_id = p_barber_id)
  ) THEN
    RETURN jsonb_build_object('error', 'Este horario ya fue reservado. Por favor elige otro.');
  END IF;

  -- Create appointment
  INSERT INTO public.appointments(
    barbershop_id, service_id, client_name, client_phone,
    appointment_date, start_time, barber_id, status
  )
  VALUES (
    v_shop.id, service_id, client_name, client_phone,
    date, public_create_appointment.start_time, p_barber_id, 'confirmada'
  )
  RETURNING id INTO v_appt_id;

  RETURN jsonb_build_object('ok', true, 'id', v_appt_id);
END;
$$;

-- ============================================================
-- 7. Grant execute permissions on updated functions
-- ============================================================
GRANT EXECUTE ON FUNCTION public.public_get_shop(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_taken_slots(TEXT, DATE, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_create_appointment(TEXT, UUID, TEXT, TEXT, DATE, TIME, UUID) TO anon, authenticated;
