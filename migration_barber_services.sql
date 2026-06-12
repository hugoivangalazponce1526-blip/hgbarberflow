-- ============================================================
-- Migration: per-barber services
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Index for fast barber-filtered queries
CREATE INDEX IF NOT EXISTS idx_services_barber_id ON public.services(barber_id);

NOTIFY pgrst, 'reload schema';
