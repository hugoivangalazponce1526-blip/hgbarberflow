-- ============================================================
-- CortaGold - Schema completo de Supabase
-- ============================================================

-- 1. TABLA: barbershops
CREATE TABLE IF NOT EXISTS public.barbershops (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  slug         text        NOT NULL UNIQUE,
  logo_url     text,
  brand_color  text        DEFAULT '#C9A84C',
  phone        text,
  address      text,
  owner_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  plan         text        NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium')),
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. TABLA: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id             uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id  uuid        REFERENCES public.barbershops(id) ON DELETE SET NULL,
  full_name      text        NOT NULL,
  role           text        NOT NULL CHECK (role IN ('super_admin', 'barber')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. TABLA: services
CREATE TABLE IF NOT EXISTS public.services (
  id             uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id  uuid          NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name           text          NOT NULL,
  duration_min   integer       NOT NULL CHECK (duration_min > 0),
  price          numeric(10,2) NOT NULL CHECK (price >= 0),
  is_active      boolean       NOT NULL DEFAULT true,
  created_at     timestamptz   NOT NULL DEFAULT now()
);

-- 4. TABLA: schedules
CREATE TABLE IF NOT EXISTS public.schedules (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id  uuid    NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  weekday        integer NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time     time    NOT NULL,
  end_time       time    NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  UNIQUE (barbershop_id, weekday)
);

-- 5. TABLA: blocked_dates
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id  uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  blocked_date   date NOT NULL,
  reason         text,
  UNIQUE (barbershop_id, blocked_date)
);

-- 6. TABLA: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id    uuid        NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  service_id       uuid        NOT NULL REFERENCES public.services(id),
  client_name      text        NOT NULL,
  client_phone     text        NOT NULL,
  appointment_date date        NOT NULL,
  start_time       time        NOT NULL,
  status           text        NOT NULL DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'completada', 'cancelada')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_barbershops_slug        ON public.barbershops(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_barbershop_id  ON public.profiles(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id  ON public.services(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_schedules_barbershop_id ON public.schedules(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_shop_id   ON public.blocked_dates(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_shop_id    ON public.appointments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date       ON public.appointments(appointment_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.barbershops  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments  ENABLE ROW LEVEL SECURITY;

-- Helper: devuelve el barbershop_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_barbershop_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT barbershop_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper: devuelve el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- === barbershops ===
DROP POLICY IF EXISTS "Barbers can read own barbershop"      ON public.barbershops;
DROP POLICY IF EXISTS "Barbers can update own barbershop"    ON public.barbershops;
DROP POLICY IF EXISTS "Super admin can read all barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Super admin can update all barbershops" ON public.barbershops;

CREATE POLICY "Barbers can read own barbershop"
  ON public.barbershops FOR SELECT TO authenticated
  USING (id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can update own barbershop"
  ON public.barbershops FOR UPDATE TO authenticated
  USING (id = public.get_my_barbershop_id());

CREATE POLICY "Super admin can read all barbershops"
  ON public.barbershops FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admin can update all barbershops"
  ON public.barbershops FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'super_admin');

-- === profiles ===
DROP POLICY IF EXISTS "Users can read own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Super admin can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Super admin can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.get_my_role() = 'super_admin');


-- === services ===
DROP POLICY IF EXISTS "Barbers can read own services"   ON public.services;
DROP POLICY IF EXISTS "Barbers can insert own services" ON public.services;
DROP POLICY IF EXISTS "Barbers can update own services" ON public.services;
DROP POLICY IF EXISTS "Barbers can delete own services" ON public.services;

CREATE POLICY "Barbers can read own services"
  ON public.services FOR SELECT TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can insert own services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can update own services"
  ON public.services FOR UPDATE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can delete own services"
  ON public.services FOR DELETE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

-- === schedules ===
DROP POLICY IF EXISTS "Barbers can read own schedules"   ON public.schedules;
DROP POLICY IF EXISTS "Barbers can insert own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Barbers can update own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Barbers can delete own schedules" ON public.schedules;

CREATE POLICY "Barbers can read own schedules"
  ON public.schedules FOR SELECT TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can insert own schedules"
  ON public.schedules FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can update own schedules"
  ON public.schedules FOR UPDATE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can delete own schedules"
  ON public.schedules FOR DELETE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

-- === blocked_dates ===
DROP POLICY IF EXISTS "Barbers can read own blocked_dates"   ON public.blocked_dates;
DROP POLICY IF EXISTS "Barbers can insert own blocked_dates" ON public.blocked_dates;
DROP POLICY IF EXISTS "Barbers can delete own blocked_dates" ON public.blocked_dates;

CREATE POLICY "Barbers can read own blocked_dates"
  ON public.blocked_dates FOR SELECT TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can insert own blocked_dates"
  ON public.blocked_dates FOR INSERT TO authenticated
  WITH CHECK (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can delete own blocked_dates"
  ON public.blocked_dates FOR DELETE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

-- === appointments ===
DROP POLICY IF EXISTS "Barbers can read own appointments"   ON public.appointments;
DROP POLICY IF EXISTS "Barbers can update own appointments" ON public.appointments;

CREATE POLICY "Barbers can read own appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

CREATE POLICY "Barbers can update own appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING (barbershop_id = public.get_my_barbershop_id());

-- ============================================================
-- FUNCIONES RPC PÚBLICAS (sin auth requerida)
-- ============================================================

-- 1. Obtener todos los datos de la barbería para la página pública
CREATE OR REPLACE FUNCTION public.public_get_shop(shop_slug text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_shop  public.barbershops%ROWTYPE;
  result  json;
BEGIN
  SELECT * INTO v_shop
  FROM public.barbershops
  WHERE slug = shop_slug AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Barbería no encontrada o inactiva');
  END IF;

  SELECT json_build_object(
    'barbershop', row_to_json(v_shop),
    'services', (
      SELECT COALESCE(json_agg(s ORDER BY s.name), '[]'::json)
      FROM public.services s
      WHERE s.barbershop_id = v_shop.id AND s.is_active = true
    ),
    'schedules', (
      SELECT COALESCE(json_agg(sc ORDER BY sc.weekday), '[]'::json)
      FROM public.schedules sc
      WHERE sc.barbershop_id = v_shop.id
    ),
    'blocked_dates', (
      SELECT COALESCE(json_agg(bd ORDER BY bd.blocked_date), '[]'::json)
      FROM public.blocked_dates bd
      WHERE bd.barbershop_id = v_shop.id
        AND bd.blocked_date >= CURRENT_DATE
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. Obtener horarios ocupados para una fecha
CREATE OR REPLACE FUNCTION public.public_get_taken_slots(shop_slug text, the_date date)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_shop_id uuid;
  result    json;
BEGIN
  SELECT id INTO v_shop_id
  FROM public.barbershops
  WHERE slug = shop_slug AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN '[]'::json;
  END IF;

  SELECT COALESCE(json_agg(a.start_time ORDER BY a.start_time), '[]'::json)
  INTO result
  FROM public.appointments a
  WHERE a.barbershop_id = v_shop_id
    AND a.appointment_date = the_date
    AND a.status != 'cancelada';

  RETURN result;
END;
$$;

-- 3. Crear una cita desde la página pública de reservas
CREATE OR REPLACE FUNCTION public.public_create_appointment(
  shop_slug    text,
  service_id   uuid,
  client_name  text,
  client_phone text,
  date         date,
  start_time   time
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_shop     public.barbershops%ROWTYPE;
  v_service  public.services%ROWTYPE;
  v_appt_id  uuid;
BEGIN
  SELECT * INTO v_shop
  FROM public.barbershops bs
  WHERE bs.slug = public_create_appointment.shop_slug AND bs.is_active = true LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Barbería no encontrada o inactiva');
  END IF;

  SELECT * INTO v_service
  FROM public.services s
  WHERE s.id = public_create_appointment.service_id AND s.barbershop_id = v_shop.id AND s.is_active = true LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Servicio no disponible');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.barbershop_id = v_shop.id
      AND a.appointment_date = public_create_appointment.date
      AND a.start_time = public_create_appointment.start_time
      AND a.status != 'cancelada'
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'El horario seleccionado ya no está disponible');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_dates bd
    WHERE bd.barbershop_id = v_shop.id AND bd.blocked_date = public_create_appointment.date
  ) THEN
    RETURN json_build_object('ok', false, 'error', 'La fecha seleccionada está bloqueada');
  END IF;

  INSERT INTO public.appointments (
    barbershop_id, service_id, client_name, client_phone,
    appointment_date, start_time, status
  ) VALUES (
    v_shop.id, public_create_appointment.service_id, public_create_appointment.client_name, public_create_appointment.client_phone,
    public_create_appointment.date, public_create_appointment.start_time, 'confirmada'
  )
  RETURNING id INTO v_appt_id;

  RETURN json_build_object('ok', true, 'id', v_appt_id);
END;
$$;

-- ============================================================
-- PERMISOS PARA LAS FUNCIONES PÚBLICAS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.public_get_shop(text)                                    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_get_taken_slots(text, date)                       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_create_appointment(text, uuid, text, text, date, time) TO anon, authenticated;
