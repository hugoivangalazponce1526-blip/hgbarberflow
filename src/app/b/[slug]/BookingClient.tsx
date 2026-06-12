/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Scissors, Clock, MapPin, Phone, User, Smartphone,
  CheckCircle2, ChevronRight, AlertTriangle, Loader2,
} from 'lucide-react';
import type { ShopData, Service, Schedule, Barber } from './page';

interface Props { shopData: ShopData; slug: string; }

// ─── Module-level helpers (no closure over component state) ───────────────────
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

// ─── Step wrapper ─────────────────────────────────────────────────────────────
function StepCard({ step, title, color, children }: {
  step: number; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="glass border border-white/5 rounded-3xl p-5 shadow-xl">
      <h2 className="font-sora text-base font-bold mb-4 flex items-center gap-2.5">
        <span className="w-6 h-6 flex-shrink-0 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center"
          style={{ color }}>{step}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Summary row ──────────────────────────────────────────────────────────────
function SRow({ label, value, color, big }: { label: string; value?: string; color?: string; big?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 text-xs">
      <span className="text-text-secondary">{label}</span>
      <span className={big ? 'font-bold text-sm' : 'font-semibold'} style={color ? { color } : {}}>{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingClient({ shopData, slug }: Props) {
  const supabase   = createClient();
  const formRef    = useRef<HTMLDivElement>(null);

  const [selectedBarber,   setSelectedBarber]   = useState<Barber | null>(null);
  const [selectedService,  setSelectedService]  = useState<Service | null>(null);
  const [selectedDate,     setSelectedDate]     = useState<Date | null>(null);
  const [selectedSlot,     setSelectedSlot]     = useState<string | null>(null);
  const [clientName,       setClientName]       = useState('');
  const [clientPhone,      setClientPhone]      = useState('');
  const [bookingLoading,   setBookingLoading]   = useState(false);
  const [bookingSuccess,   setBookingSuccess]   = useState<string | null>(null);
  const [slotsLoading,     setSlotsLoading]     = useState(false);
  const [availableSlots,   setAvailableSlots]   = useState<string[]>([]);

  const shop        = shopData.barbershop;
  const color       = shop.brand_color || '#C9A84C';
  const isEquipo    = shop.plan_type === 'equipo';
  const barbers     = shopData.barbers;
  const showBarberStep = isEquipo && barbers.length > 1;

  // Auto-select single barber in equipo
  useEffect(() => {
    if (isEquipo && barbers.length === 1 && !selectedBarber) setSelectedBarber(barbers[0]);
  }, [isEquipo, barbers, selectedBarber]);

  // Scroll to confirm form when slot picked
  useEffect(() => {
    if (selectedSlot && formRef.current) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [selectedSlot]);

  // Derived: services and schedules filtered by barber
  const visibleServices: Service[] = isEquipo && barbers.length > 0
    ? (selectedBarber ? shopData.services.filter(s => s.barber_id === selectedBarber.id) : [])
    : shopData.services;

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

  // Fetch slots
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
      } catch (e) {
        console.error(e); setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, selectedBarber, slug]);

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
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
    } catch (err: any) {
      alert(err.message || 'Error al guardar la cita');
    } finally {
      setBookingLoading(false);
    }
  }

  function resetAll() {
    setBookingSuccess(null);
    setSelectedBarber(isEquipo && barbers.length === 1 ? barbers[0] : null);
    setSelectedService(null); setSelectedDate(null); setSelectedSlot(null);
    setClientName(''); setClientPhone('');
  }

  // Step numbers
  const sN = (n: number) => showBarberStep ? n : n - 1;

  // ── Success ────────────────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="min-h-[100dvh] bg-background text-text-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm glass border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <h1 className="font-sora text-xl font-bold mb-2">¡Reserva Confirmada!</h1>
          <p className="text-text-secondary text-sm mb-5">Tu cita en <strong>{shop.name}</strong> fue agendada.</p>
          <div className="bg-surface-dark border border-white/5 rounded-2xl p-4 text-left mb-5">
            <SRow label="Servicio" value={selectedService?.name} color={color} />
            {selectedBarber && <SRow label="Barbero" value={selectedBarber.full_name} />}
            <SRow label="Fecha" value={selectedDate?.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })?.toUpperCase()} />
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
          <div className="flex flex-col gap-2.5">
            {shop.phone && (
              <a href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(shop.name)},%20tengo%20una%20cita%20el%20${selectedDate?.toLocaleDateString('es-ES')}%20a%20las%20${selectedSlot}%20para%20${selectedService?.name}.`}
                target="_blank" rel="noopener noreferrer"
                className="w-full bg-success text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                Confirmar por WhatsApp
              </a>
            )}
            <button onClick={resetAll}
              className="w-full bg-surface-light text-text-primary font-semibold py-3.5 rounded-xl border border-white/5 text-sm">
              Agendar Otra Cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking page ───────────────────────────────────────────────────────────
  const readyForForm = !!selectedService && !!selectedDate && !!selectedSlot && (!isEquipo || !!selectedBarber || barbers.length === 0);

  return (
    <div className="min-h-[100dvh] bg-background text-text-primary font-inter">
      {/* Ambient glow */}
      <div className="fixed top-0 left-0 right-0 h-64 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: color }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {shop.logo_url ? (
              <div className="relative w-9 h-9 flex-shrink-0 rounded-xl overflow-hidden border border-white/10">
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="36px" />
              </div>
            ) : (
              <div className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                <Scissors className="w-4 h-4 rotate-90" style={{ color }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-sora text-sm font-bold truncate">{shop.name}</p>
              {shop.address && (
                <p className="text-[10px] text-text-secondary flex items-center gap-1 truncate">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                  {shop.address.length > 38 ? shop.address.slice(0, 38) + '…' : shop.address}
                </p>
              )}
            </div>
          </div>
          {shop.phone && (
            <a href={`tel:${shop.phone}`}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-surface-light border border-white/5 text-text-secondary active:scale-95 transition-all">
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="w-full relative overflow-hidden" style={{ height: 180 }}>
        {shop.logo_url ? (
          <>
            <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}20 0%, transparent 70%)` }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
              style={{ backgroundColor: `${color}20`, color, border: `2px solid ${color}40` }}>
              {shop.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4 max-w-4xl mx-auto">
          <h1 className="font-sora text-2xl sm:text-3xl font-extrabold drop-shadow-md">{shop.name}</h1>
        </div>
      </div>

      {/* Content grid */}
      <div className="max-w-4xl mx-auto px-4 py-5 grid md:grid-cols-12 gap-4 items-start relative z-10">

        {/* Left: steps */}
        <div className="md:col-span-8 flex flex-col gap-4">

          {/* STEP 1: Barber */}
          {showBarberStep && (
            <StepCard step={1} title="Elige tu Barbero" color={color}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {barbers.map(b => {
                  const sel = selectedBarber?.id === b.id;
                  return (
                    <button key={b.id}
                      onClick={() => { setSelectedBarber(b); setSelectedService(null); setSelectedDate(null); setSelectedSlot(null); }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-3 active:scale-95 min-h-[64px] ${sel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 hover:bg-surface-light/30'}`}
                      style={{ borderColor: sel ? color : undefined }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
                        {b.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-sora font-semibold text-sm">{b.full_name}</span>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* STEP 1/2: Service */}
          {(!showBarberStep || selectedBarber) && (
            <StepCard step={sN(2)} title="Selecciona un Servicio" color={color}>
              {visibleServices.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-50" style={{ color }} />
                  {isEquipo && selectedBarber ? 'Este barbero no tiene servicios configurados.' : 'Sin servicios disponibles.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleServices.map(sv => {
                    const sel = selectedService?.id === sv.id;
                    return (
                      <button key={sv.id}
                        onClick={() => { setSelectedService(sv); setSelectedDate(null); setSelectedSlot(null); }}
                        className={`text-left p-4 rounded-2xl border transition-all flex flex-col active:scale-95 min-h-[88px] ${sel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 hover:bg-surface-light/30'}`}
                        style={{ borderColor: sel ? color : undefined }}>
                        <span className="font-sora font-bold text-sm leading-snug flex-1">{sv.name}</span>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-text-secondary flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{sv.duration_min} min
                          </span>
                          <span className="font-sora font-extrabold text-base" style={{ color }}>${sv.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </StepCard>
          )}

          {/* STEP 2/3: Date */}
          {selectedService && (!isEquipo || !!selectedBarber || barbers.length === 0) && (
            <StepCard step={sN(3)} title="Selecciona Fecha" color={color}>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }).map((date, i) => {
                  const disabled = isDateDisabled(date);
                  const sel = selectedDate && toYMD(selectedDate) === toYMD(date);
                  return (
                    <button key={i} disabled={disabled}
                      onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                      className={`flex-shrink-0 w-[60px] min-h-[76px] rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${disabled ? 'opacity-20 cursor-not-allowed border-transparent bg-transparent' : sel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 text-text-secondary'}`}
                      style={{ borderColor: sel ? color : undefined }}>
                      <span className="text-[9px] uppercase font-bold tracking-wider mb-0.5">
                        {date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}
                      </span>
                      <span className="font-sora text-xl font-bold">{date.getDate()}</span>
                      {i === 0 && !disabled && <span className="text-[8px] font-bold mt-0.5" style={{ color }}>Hoy</span>}
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* STEP 3/4: Time */}
          {selectedService && selectedDate && (!isEquipo || !!selectedBarber || barbers.length === 0) && (
            <StepCard step={sN(4)} title="Selecciona Hora" color={color}>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color }} />
                  <span className="text-xs text-text-secondary">Calculando disponibilidad…</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-50" style={{ color }} />
                  Sin horarios disponibles para esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {availableSlots.map(slot => {
                    const sel = selectedSlot === slot;
                    return (
                      <button key={slot} onClick={() => setSelectedSlot(slot)}
                        className={`py-3.5 rounded-xl border text-center font-sora font-semibold text-sm transition-all active:scale-95 min-h-[48px] ${sel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 text-text-secondary hover:bg-surface-light/30'}`}
                        style={{ borderColor: sel ? color : undefined }}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </StepCard>
          )}

          {/* ── Mobile confirm form (inline, shown after slot selected) ── */}
          {readyForForm && (
            <div ref={formRef} className="md:hidden glass border border-white/5 rounded-3xl p-5 shadow-xl">
              <h3 className="font-sora text-base font-bold mb-3">Confirmar Reserva</h3>
              {/* Mini summary */}
              <div className="bg-surface-dark/60 border border-white/5 rounded-2xl p-4 mb-4">
                <SRow label="Servicio" value={selectedService?.name} color={color} />
                {selectedBarber && <SRow label="Barbero" value={selectedBarber.full_name} />}
                <SRow label="Fecha" value={selectedDate?.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()} />
                <SRow label="Hora" value={`${selectedSlot} hrs`} color={color} big />
              </div>
              {/* Inline form — NOT a sub-component to avoid focus loss */}
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="m-name" className="text-xs text-text-secondary font-medium pl-1">Tu Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input id="m-name" type="text" required value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Ej: Alejandro Pérez"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="m-phone" className="text-xs text-text-secondary font-medium pl-1">WhatsApp</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input id="m-phone" type="tel" required value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="+56912345678"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
                  </div>
                </div>
                <button type="button" disabled={bookingLoading || !clientName || !clientPhone}
                  onClick={handleBooking as any}
                  className="w-full text-background font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg mt-1"
                  style={{ backgroundColor: color, boxShadow: `0 8px 20px -4px ${color}40` }}>
                  {bookingLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Agendando…</> : <>Confirmar Reserva <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Bottom spacer for mobile so content clears bottom bar */}
          <div className="h-6 md:hidden" />
        </div>

        {/* Right: desktop sticky summary + form */}
        <div className="hidden md:block md:col-span-4 md:sticky md:top-20">
          <div className="glass border border-white/5 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="font-sora text-base font-bold">Detalle del Agendamiento</h3>

            <div className="bg-surface-dark/60 border border-white/5 rounded-2xl p-4">
              {selectedService ? (
                <>
                  <SRow label="Servicio" value={selectedService.name} color={color} />
                  <SRow label="Duración" value={`${selectedService.duration_min} min`} />
                  <SRow label="Precio" value={`$${selectedService.price}`} color={color} big />
                  {selectedBarber && <SRow label="Barbero" value={selectedBarber.full_name} />}
                  {selectedDate && <SRow label="Fecha" value={selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()} />}
                  {selectedSlot && <SRow label="Hora" value={`${selectedSlot} hrs`} color={color} big />}
                </>
              ) : (
                <p className="text-xs text-text-secondary text-center py-2">
                  {isEquipo && !selectedBarber && barbers.length > 1 ? 'Elige un barbero para comenzar.' : 'Selecciona un servicio para comenzar.'}
                </p>
              )}
            </div>

            {readyForForm && (
              <form onSubmit={handleBooking} className="flex flex-col gap-3.5 border-t border-white/5 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="d-name" className="text-xs text-text-secondary font-medium pl-1">Tu Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input id="d-name" type="text" required value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Ej: Alejandro Pérez"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="d-phone" className="text-xs text-text-secondary font-medium pl-1">WhatsApp</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input id="d-phone" type="tel" required value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      placeholder="+56912345678"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
                  </div>
                </div>
                <button type="submit" disabled={bookingLoading}
                  className="w-full text-background font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none shadow-lg"
                  style={{ backgroundColor: color, boxShadow: `0 8px 20px -4px ${color}40` }}>
                  {bookingLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Agendando…</> : <>Confirmar Reserva <ChevronRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
