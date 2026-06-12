import { cache } from 'react';
import { createClient as createAnon } from '@supabase/supabase-js';
import { AlertTriangle } from 'lucide-react';
import BookingClient from './BookingClient';
import type { Metadata } from 'next';

export const revalidate = 60; // ISR: revalidate shop data every 60 seconds

export interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  is_active: boolean;
}

export interface Schedule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  break_start?: string | null;
  break_end?: string | null;
  custom_slots?: string[] | null;
}

export interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export interface ShopData {
  barbershop: Barbershop;
  services: Service[];
  schedules: Schedule[];
  blocked_dates: BlockedDate[];
}

const getShopData = cache(async (slug: string): Promise<ShopData | null> => {
  const supabase = createAnon(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data, error } = await supabase.rpc('public_get_shop', { shop_slug: slug });

  if (error || !data) return null;

  const parsed: any = typeof data === 'string' ? JSON.parse(data) : data;
  const shop = parsed.barbershop || parsed.shop || parsed.details;

  if (!shop || shop.is_active === false) return null;

  return {
    barbershop: shop,
    services: parsed.services || parsed.active_services || [],
    schedules: parsed.schedules || parsed.active_schedules || [],
    blocked_dates: parsed.blocked_dates || parsed.blocked_dates_future || [],
  };
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const shopData = await getShopData(params.slug);
  if (!shopData) return { title: 'Barbería | BarberFlow' };
  return {
    title: `${shopData.barbershop.name} | Reserva tu Cita`,
    description: `Agenda tu cita en ${shopData.barbershop.name} de forma rápida y sencilla. Sin registros, en menos de 10 segundos.`,
  };
}

export default async function BookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const shopData = await getShopData(params.slug);

  if (!shopData) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h1 className="font-sora text-2xl font-bold mb-3">Barbería No Disponible</h1>
        <p className="text-text-secondary max-w-md mb-8 font-inter">
          No pudimos encontrar la información de la barbería solicitada.
        </p>
        <a
          href="/"
          className="bg-gold hover:bg-gold-hover text-background font-bold px-6 py-3 rounded-xl transition-all font-sora text-sm"
        >
          Ir a BarberFlow
        </a>
      </div>
    );
  }

  return <BookingClient shopData={shopData} slug={params.slug} />;
}
