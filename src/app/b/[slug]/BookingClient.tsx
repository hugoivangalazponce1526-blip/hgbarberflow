/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Clock, MapPin, Phone, User, Smartphone,
  CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, Loader2,
} from 'lucide-react';
import type { ShopData, Service, Schedule, Barber } from './page';

interface Props { shopData: ShopData; slug: string; }

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toMin(t: string) {
  const [h, m] = t.split(':').map(Number); return h * 60 + m;
}
function buildSlots(start: string, end: string, dur: number, bs?: string | null, be?: string | null) {
  const s0 = toMin(start), e0 = toMin(end);
  const bs0 = bs ? toMin(bs) : null, be0 = be ? toMin(be) : null;
  const out: string[] = [];
  for (let m = s0; m + dur <= e0; m += dur) {
    if (bs0 !== null && be0 !== null && m >= bs0 && m < be0) continue;
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}

function SRow({ label, value, color, big }: { label: string; value?: string; color?: string; big?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className={big ? 'font-bold text-sm' : 'font-semibold'} style={color ? { color } : {}}>{value}</span>
    </div>
  );
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BookingClient({ shopData, slug }: Props) {
  const supabase  = createClient();
  const formRef   = useRef<HTMLDivElement>(null);

  const [selectedBarber,  setSelectedBarber]  = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate,    setSelectedDate]    = useState<Date | null>(null);
  const [selectedSlot,    setSelectedSlot]    = useState<string | null>(null);
  const [clientName,      setClientName]      = useState('');
  const [clientPhone,     setClientPhone]     = useState('');
  const [bookingLoading,  setBookingLoading]  = useState(false);
  const [bookingSuccess,  setBookingSuccess]  = useState<string | null>(null);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [availableSlots,  setAvailableSlots]  = useState<string[]>([]);

  // Week navigation: 0 = current week (from today), 1 = next week, etc.
  const [weekOffset, setWeekOffset]   = useState(0);
  // Hour pagination: page of 9 slots at a time (3×3)
  const [slotPage,   setSlotPage]     = useState(0);
  const SLOTS_PER_PAGE = 9;

  const shop     = shopData.barbershop;
  const isEquipo = shop.plan_type === 'equipo';
  const barbers  = shopData.barbers;
  const showBarberStep = isEquipo && barbers.length > 1;

  // Color adapts to selected barber (equipo), fallback to shop color
  const color = (isEquipo && selectedBarber?.brand_color) || shop.brand_color || '#C9A84C';

  // Hero adapts: shows barber identity once selected, otherwise shop identity
  const heroPhoto    = (isEquipo && selectedBarber?.avatar_url) ? selectedBarber.avatar_url : shop.logo_url;
  const heroName     = (isEquipo && selectedBarber) ? selectedBarber.full_name : shop.name;
  const heroSub      = (isEquipo && selectedBarber) ? shop.name : shop.address;

  const visibleServices: Service[] = isEquipo && barbers.length > 0
    ? (selectedBarber ? shopData.services.filter(s => s.barber_id === selectedBarber.id) : [])
    : shopData.services;

  // Auto-select single barber
  useEffect(() => {
    if (isEquipo && barbers.length === 1 && !selectedBarber) setSelectedBarber(barbers[0]);
  }, [isEquipo, barbers, selectedBarber]);

  // Scroll to form when slot selected
  useEffect(() => {
    if (selectedSlot && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    }
  }, [selectedSlot]);

  // Reset slot page when slots change
  useEffect(() => { setSlotPage(0); }, [availableSlots]);

  function relevantSchedules(barber: Barber | null): Schedule[] {
    return isEquipo && barbers.length > 0 && barber
      ? shopData.schedules.filter(s => s.barber_id === barber.id)
      : shopData.schedules.filter(s => !s.barber_id);
  }

  function isDateDisabled(date: Date) {
    const str = toYMD(date);
    if (shopData.blocked_dates.some(bd => bd.blocked_date.slice(0, 10) === str)) return true;
    return !relevantSchedules(selectedBarber).some(s => s.weekday === date.getDay() && s.is_active);
  }

  // Build 7-day week starting from today + weekOffset*7
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7 + i);
    return d;
  });

  const canGoPrevWeek = weekOffset > 0;
  const canGoNextWeek = weekOffset < 3; // max 4 weeks ahead

  // Fetch available slots
  useEffect(() => {
    if (!selectedDate || !selectedService) { setAvailableSlots([]); return; }
    if (isEquipo && barbers.length > 0 && !selectedBarber) { setAvailableSlots([]); return; }
    const d = selectedDate, svc = selectedService, barber = selectedBarber;
    async function run() {
      try {
        setSlotsLoading(true);
        const dateStr = toYMD(d);
        const { data, error } = await supabase.rpc('public_get_taken_slots', {
          shop_slug: slug, the_date: dateStr, p_barber_id: barber?.id ?? null,
        });
        if (error) throw error;
        const raw: any[] = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
        const taken = raw.map((t: any) => (typeof t === 'string' ? t : t.start_time || '').slice(0, 5));
        const sched = relevantSchedules(barber).find(s => s.weekday === d.getDay() && s.is_active);
        if (!sched) { setAvailableSlots([]); return; }
        const slots = sched.custom_slots?.length
          ? sched.custom_slots
          : buildSlots(sched.start_time, sched.end_time, svc.duration_min, sched.break_start, sched.break_end);
        let free = slots.filter(s => !taken.includes(s));
        if (dateStr === toYMD(new Date())) {
          const nowMin = new Date().getHours() * 60 + new Date().getMinutes() + 10;
          free = free.filter(s => { const [h, m] = s.split(':').map(Number); return h * 60 + m > nowMin; });
        }
        setAvailableSlots(free);
      } catch (e) { console.error(e); setAvailableSlots([]); }
      finally { setSlotsLoading(false); }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, selectedBarber, slug]);

  async function handleBooking(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;
    try {
      setBookingLoading(true);
      const { data, error } = await supabase.rpc('public_create_appointment', {
        shop_slug: slug, service_id: selectedService.id,
        client_name: clientName, client_phone: clientPhone,
        date: toYMD(selectedDate), start_time: `${selectedSlot}:00`,
        p_barber_id: selectedBarber?.id ?? null,
      });
      if (error) throw error;
      const res: any = data ? (typeof data === 'string' ? JSON.parse(data) : data) : {};
      if (res.ok || res.id) setBookingSuccess(res.id || 'ok');
      else throw new Error(res.error || 'No se pudo crear la cita.');
    } catch (err: any) { alert(err.message || 'Error al guardar la cita'); }
    finally { setBookingLoading(false); }
  }

  function resetAll() {
    setBookingSuccess(null);
    setSelectedBarber(isEquipo && barbers.length === 1 ? barbers[0] : null);
    setSelectedService(null); setSelectedDate(null); setSelectedSlot(null);
    setClientName(''); setClientPhone('');
    setWeekOffset(0); setSlotPage(0);
  }

  const sN = (n: number) => showBarberStep ? n : n - 1;
  const readyForForm = !!selectedService && !!selectedDate && !!selectedSlot &&
    (!isEquipo || !!selectedBarber || barbers.length === 0);

  // Paginated slots
  const totalSlotPages = Math.ceil(availableSlots.length / SLOTS_PER_PAGE);
  const pagedSlots = availableSlots.slice(slotPage * SLOTS_PER_PAGE, (slotPage + 1) * SLOTS_PER_PAGE);

  // ── Success screen ────────────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="min-h-[100dvh] bg-background text-text-primary flex items-center justify-center p-4 overflow-x-hidden">
        <div className="w-full max-w-sm rounded-3xl p-6 text-center border border-white/8" style={{ backgroundColor: 'rgba(26,26,26,0.95)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${color}20`, border: `2px solid ${color}40` }}>
            <CheckCircle2 className="w-8 h-8" style={{ color }} />
          </div>
          <h1 className="font-sora text-xl font-bold mb-2">¡Reserva Confirmada!</h1>
          <p className="text-text-secondary text-sm mb-5 leading-relaxed">
            Tu cita en <strong style={{ color }}>{shop.name}</strong> fue agendada con éxito.
          </p>
          <div className="rounded-2xl p-4 text-left mb-5 border border-white/5" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <SRow label="Servicio" value={selectedService?.name} color={color} />
            {selectedBarber && <SRow label="Barbero" value={selectedBarber.full_name} />}
            <SRow label="Fecha" value={selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} />
            <SRow label="Hora" value={`${selectedSlot} hrs`} color={color} big />
            {shop.address && (
              <div className="pt-2 mt-1 border-t border-white/5">
                <p className="text-xs text-text-secondary flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color }} />
                  {shop.address}
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {shop.phone && (
              <a
                href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(shop.name)},%20tengo%20una%20cita%20el%20${selectedDate?.toLocaleDateString('es-ES')}%20a%20las%20${selectedSlot}%20para%20${selectedService?.name}.`}
                target="_blank" rel="noopener noreferrer"
                className="w-full font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#25D366', color: '#fff' }}>
                Confirmar por WhatsApp
              </a>
            )}
            <button onClick={resetAll}
              className="w-full font-semibold py-4 rounded-xl border border-white/8 text-sm"
              style={{ backgroundColor: 'rgba(40,40,40,0.8)' }}>
              Agendar Otra Cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-text-primary font-inter">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 80% 30% at 50% 0%, ${color}10 0%, transparent 60%)` }} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/8" style={{ backgroundColor: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <p className="font-sora text-sm font-bold truncate">{shop.name}</p>
          {shop.phone && (
            <a href={`tel:${shop.phone}`}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-lg border border-white/8 text-text-secondary text-xs font-medium"
              style={{ backgroundColor: 'rgba(30,30,30,0.8)' }}>
              <Phone className="w-3.5 h-3.5" />
              Llamar
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: 180 }}>
        {/* Fondo desenfocado con la foto activa */}
        {heroPhoto && (
          <div className="absolute inset-0">
            <Image src={heroPhoto} alt="" fill className="object-cover scale-110" style={{ filter: 'blur(24px)', opacity: 0.18 }} sizes="100vw" />
          </div>
        )}
        {/* Gradiente de marca — se actualiza con el color del barbero seleccionado */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 120% 80% at 50% -10%, ${color}18 0%, transparent 65%)` }} />
        <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(to bottom, transparent, #0D0D0D)' }} />

        {/* Contenido hero */}
        <div className="relative z-10 flex flex-col items-center pt-8 pb-8 px-4 text-center">
          {heroPhoto ? (
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden mb-4 shadow-2xl"
              style={{ border: `2px solid ${color}40`, boxShadow: `0 12px 40px ${color}25, 0 4px 16px rgba(0,0,0,0.6)` }}>
              <Image src={heroPhoto} alt={heroName} fill className="object-cover" sizes="96px" priority />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-bold text-3xl font-sora mb-4 shadow-2xl"
              style={{ backgroundColor: `${color}18`, color, border: `2px solid ${color}35`, boxShadow: `0 12px 40px ${color}20` }}>
              {heroName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-sora text-xl font-bold mb-1 leading-tight">{heroName}</h1>
          {heroSub && (
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
              {!selectedBarber && <MapPin className="w-3 h-3 flex-shrink-0" />}
              <span>{heroSub}</span>
            </p>
          )}
          {/* Watermark */}
          <div className="mt-4 flex items-center gap-1.5 opacity-25">
            <svg viewBox="0 0 14 20" fill="none" style={{ width: 9, height: 14 }}>
              <rect x="1" y="1" width="12" height="18" rx="6" fill="none" stroke="currentColor" strokeWidth="1"/>
              <rect x="4" y="4" width="6" height="3" rx="0.5" fill="currentColor"/>
              <rect x="4" y="9" width="6" height="3" rx="0.5" fill="currentColor"/>
              <rect x="4" y="14" width="6" height="2.5" rx="0.5" fill="currentColor"/>
            </svg>
            <span className="text-[10px] text-text-secondary font-inter tracking-wide">BarberFlow</span>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="px-4 pb-4 flex flex-col gap-3 relative z-10">

        {/* ── PASO 1: Barbero ── */}
        {showBarberStep && (
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ backgroundColor: 'rgba(22,22,22,0.95)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20`, color }}>1</span>
              <span className="font-sora text-sm font-bold">Elige tu Barbero</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {barbers.map(b => {
                const sel = selectedBarber?.id === b.id;
                const bColor = b.brand_color || shop.brand_color || '#C9A84C';
                return (
                  <button key={b.id}
                    onClick={() => { setSelectedBarber(b); setSelectedService(null); setSelectedDate(null); setSelectedSlot(null); }}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left"
                    style={{
                      backgroundColor: sel ? `${bColor}15` : 'rgba(30,30,30,0.6)',
                      borderColor: sel ? bColor : 'rgba(255,255,255,0.06)',
                    }}>
                    {/* Avatar — foto si tiene, sino inicial con su color */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border"
                      style={{ borderColor: sel ? `${bColor}50` : 'rgba(255,255,255,0.06)' }}>
                      {b.avatar_url ? (
                        <Image src={b.avatar_url} alt={b.full_name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-lg font-sora"
                          style={{ backgroundColor: `${bColor}20`, color: bColor }}>
                          {b.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sora font-semibold text-sm truncate">{b.full_name}</p>
                      {b.brand_color && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: bColor }} />
                          <span className="text-[10px] text-text-secondary font-mono uppercase">{bColor}</span>
                        </div>
                      )}
                    </div>
                    {sel && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: bColor }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PASO 2: Servicio ── */}
        {(!showBarberStep || selectedBarber) && (
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ backgroundColor: 'rgba(22,22,22,0.95)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20`, color }}>{sN(2)}</span>
              <span className="font-sora text-sm font-bold">Selecciona un Servicio</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {visibleServices.length === 0 ? (
                <div className="py-6 text-center text-text-secondary text-sm">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-40" style={{ color }} />
                  Sin servicios disponibles.
                </div>
              ) : visibleServices.map(sv => {
                const sel = selectedService?.id === sv.id;
                return (
                  <button key={sv.id}
                    onClick={() => { setSelectedService(sv); setSelectedDate(null); setSelectedSlot(null); }}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] text-left w-full"
                    style={{
                      backgroundColor: sel ? `${color}15` : 'rgba(30,30,30,0.6)',
                      borderColor: sel ? color : 'rgba(255,255,255,0.06)',
                    }}>
                    <div className="min-w-0 flex-1">
                      <p className="font-sora font-bold text-sm truncate">{sv.name}</p>
                      <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />{sv.duration_min} min
                      </p>
                    </div>
                    <span className="font-sora font-extrabold text-base flex-shrink-0" style={{ color }}>${sv.price.toLocaleString('es-CL')}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PASO 3: Fecha — semana a la vez ── */}
        {selectedService && (!isEquipo || !!selectedBarber || barbers.length === 0) && (
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ backgroundColor: 'rgba(22,22,22,0.95)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}>{sN(3)}</span>
                <span className="font-sora text-sm font-bold">Selecciona Fecha</span>
              </div>
              {/* Week nav arrows */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setWeekOffset(w => w - 1); setSelectedDate(null); setSelectedSlot(null); }}
                  disabled={!canGoPrevWeek}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 disabled:opacity-20 active:scale-90 transition-all"
                  style={{ backgroundColor: 'rgba(40,40,40,0.8)' }}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-text-secondary font-medium px-1">
                  {MONTHS_ES[weekDates[0].getMonth()]} {weekDates[0].getDate()}–{weekDates[6].getDate()}
                </span>
                <button
                  onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(null); setSelectedSlot(null); }}
                  disabled={!canGoNextWeek}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 disabled:opacity-20 active:scale-90 transition-all"
                  style={{ backgroundColor: 'rgba(40,40,40,0.8)' }}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* 7-day grid */}
            <div className="p-3 grid grid-cols-7 gap-1.5">
              {weekDates.map((date, i) => {
                const disabled = isDateDisabled(date);
                const sel = selectedDate && toYMD(selectedDate) === toYMD(date);
                const isPast = date < today;
                const isReallyDisabled = disabled || isPast;
                return (
                  <button key={i}
                    disabled={isReallyDisabled}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); setSlotPage(0); }}
                    className="flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 py-2"
                    style={{
                      backgroundColor: isReallyDisabled ? 'transparent' : sel ? `${color}20` : 'rgba(35,35,35,0.8)',
                      borderColor: isReallyDisabled ? 'transparent' : sel ? color : 'rgba(255,255,255,0.06)',
                      opacity: isReallyDisabled ? 0.25 : 1,
                      cursor: isReallyDisabled ? 'not-allowed' : 'pointer',
                    }}>
                    <span className="text-[9px] font-bold uppercase opacity-60">{DAYS_ES[date.getDay()]}</span>
                    <span className="font-sora text-base font-bold leading-tight" style={sel ? { color } : {}}>{date.getDate()}</span>
                    {toYMD(date) === toYMD(new Date()) && !isReallyDisabled && (
                      <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: color }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PASO 4: Hora — paginada ── */}
        {selectedService && selectedDate && (!isEquipo || !!selectedBarber || barbers.length === 0) && (
          <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ backgroundColor: 'rgba(22,22,22,0.95)' }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}20`, color }}>{sN(4)}</span>
                <span className="font-sora text-sm font-bold">Selecciona Hora</span>
              </div>
              {/* Slot page arrows */}
              {totalSlotPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSlotPage(p => p - 1)}
                    disabled={slotPage === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 disabled:opacity-20 active:scale-90 transition-all"
                    style={{ backgroundColor: 'rgba(40,40,40,0.8)' }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-text-secondary font-medium px-1">{slotPage + 1}/{totalSlotPages}</span>
                  <button
                    onClick={() => setSlotPage(p => p + 1)}
                    disabled={slotPage >= totalSlotPages - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/8 disabled:opacity-20 active:scale-90 transition-all"
                    style={{ backgroundColor: 'rgba(40,40,40,0.8)' }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="p-3">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                  <span className="text-xs text-text-secondary">Calculando…</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-6 text-center text-text-secondary text-sm">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-40" style={{ color }} />
                  Sin horarios disponibles para esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {pagedSlots.map(slot => {
                    const sel = selectedSlot === slot;
                    return (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className="rounded-xl border text-center font-sora font-bold text-sm transition-all active:scale-95 py-3.5"
                        style={{
                          backgroundColor: sel ? `${color}20` : 'rgba(35,35,35,0.8)',
                          borderColor: sel ? color : 'rgba(255,255,255,0.06)',
                          color: sel ? color : undefined,
                        }}>
                        {slot}
                      </button>
                    );
                  })}
                  {/* Empty placeholders to keep grid stable */}
                  {Array.from({ length: SLOTS_PER_PAGE - pagedSlots.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="rounded-xl py-3.5 opacity-0 pointer-events-none" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 5: Confirmar ── */}
        {readyForForm && (
          <div ref={formRef} className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}40`, backgroundColor: 'rgba(22,22,22,0.98)' }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: `${color}20`, background: `linear-gradient(90deg, ${color}15 0%, transparent 80%)` }}>
              <span className="w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}30`, color }}>{sN(5)}</span>
              <span className="font-sora text-sm font-bold">Confirmar Reserva</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {/* Summary */}
              <div className="rounded-xl p-3 border border-white/5" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <SRow label="Servicio" value={selectedService?.name} color={color} />
                {selectedBarber && <SRow label="Barbero" value={selectedBarber.full_name} />}
                <SRow label="Fecha" value={selectedDate?.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()} />
                <SRow label="Hora" value={`${selectedSlot} hrs`} color={color} big />
                <SRow label="Precio" value={`$${selectedService?.price.toLocaleString('es-CL')}`} color={color} big />
              </div>
              {/* Form fields */}
              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="m-name" className="text-xs text-text-secondary font-medium block mb-1.5">Tu Nombre</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-xl border border-white/8" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <User className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <input
                      id="m-name" type="text" required autoComplete="name"
                      value={clientName} onChange={e => setClientName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="bg-transparent text-text-primary text-sm font-medium w-full outline-none placeholder:text-text-secondary/50"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="m-phone" className="text-xs text-text-secondary font-medium block mb-1.5">WhatsApp / Teléfono</label>
                  <div className="flex items-center gap-2.5 px-3.5 py-3.5 rounded-xl border border-white/8" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Smartphone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                    <input
                      id="m-phone" type="tel" required autoComplete="tel"
                      value={clientPhone} onChange={e => setClientPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="bg-transparent text-text-primary text-sm font-medium w-full outline-none placeholder:text-text-secondary/50"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={bookingLoading || !clientName.trim() || !clientPhone.trim()}
                  onClick={() => handleBooking()}
                  className="w-full font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  style={{ backgroundColor: color, color: '#0A0A0A', boxShadow: `0 8px 20px -4px ${color}50` }}>
                  {bookingLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Agendando…</>
                    : <>Confirmar Reserva <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
