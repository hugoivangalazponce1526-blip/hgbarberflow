/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  Scissors,
  Clock,
  MapPin,
  Phone,
  User,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { ShopData, Service, Schedule, Barber } from './page';

interface Props {
  shopData: ShopData;
  slug: string;
}

export default function BookingClient({ shopData, slug }: Props) {
  const supabase = createClient();
  const formRef = useRef<HTMLDivElement>(null);

  const [selectedBarber, setSelectedBarber]       = useState<Barber | null>(null);
  const [selectedService, setSelectedService]     = useState<Service | null>(null);
  const [selectedDate, setSelectedDate]           = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot]   = useState<string | null>(null);
  const [clientName, setClientName]               = useState('');
  const [clientPhone, setClientPhone]             = useState('');
  const [bookingLoading, setBookingLoading]       = useState(false);
  const [bookingSuccess, setBookingSuccess]       = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading]           = useState(false);
  const [availableSlots, setAvailableSlots]       = useState<string[]>([]);

  const shop        = shopData.barbershop;
  const activeColor = shop.brand_color || '#C9A84C';

  // Equipo logic: show barber step only when plan=equipo AND 2+ barbers
  // If exactly 1 barber in equipo, auto-select them (no visible step needed)
  const isEquipoShop       = shop.plan_type === 'equipo';
  const isEquipoWithBarbers = isEquipoShop && shopData.barbers.length > 0;
  const showBarberStep      = isEquipoShop && shopData.barbers.length > 1;

  // Auto-select single equipo barber
  useEffect(() => {
    if (isEquipoShop && shopData.barbers.length === 1 && !selectedBarber) {
      setSelectedBarber(shopData.barbers[0]);
    }
  }, [isEquipoShop, shopData.barbers, selectedBarber]);

  // Services filtered by selected barber (equipo) or all (individual)
  const visibleServices: Service[] = isEquipoWithBarbers && selectedBarber
    ? shopData.services.filter(s => s.barber_id === selectedBarber.id)
    : isEquipoWithBarbers
      ? []
      : shopData.services;

  // Schedules for current barber or shop
  const getRelevantSchedules = (barber: Barber | null): Schedule[] =>
    isEquipoWithBarbers && barber
      ? shopData.schedules.filter(s => s.barber_id === barber.id)
      : shopData.schedules.filter(s => !s.barber_id);

  // Step numbers adapt to equipo vs individual
  const sN = (base: number) => showBarberStep ? base : base - 1;

  // Auto-scroll to confirm form when slot selected
  useEffect(() => {
    if (selectedTimeSlot && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  }, [selectedTimeSlot]);

  // Fetch taken slots
  useEffect(() => {
    if (!selectedDate || !selectedService) { setAvailableSlots([]); return; }
    if (isEquipoWithBarbers && !selectedBarber) { setAvailableSlots([]); return; }

    const d = selectedDate, svc = selectedService, barber = selectedBarber;

    async function fetchSlots() {
      try {
        setSlotsLoading(true);
        const dateStr = toYMD(d);

        const { data, error: rpcErr } = await supabase.rpc('public_get_taken_slots', {
          shop_slug:   slug,
          the_date:    dateStr,
          p_barber_id: barber?.id ?? null,
        });
        if (rpcErr) throw rpcErr;

        const rawTaken: any[] = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];
        const taken = rawTaken.map((t: any) =>
          (typeof t === 'string' ? t : t.start_time || '').substring(0, 5)
        );

        const dayOfWeek  = d.getDay();
        const schedules  = getRelevantSchedules(barber);
        const activeSched = schedules.find((s: Schedule) => s.weekday === dayOfWeek && s.is_active);

        if (!activeSched) { setAvailableSlots([]); return; }

        let slots: string[];
        if (activeSched.custom_slots && activeSched.custom_slots.length > 0) {
          slots = activeSched.custom_slots;
        } else {
          slots = buildSlots(
            activeSched.start_time, activeSched.end_time,
            svc.duration_min, activeSched.break_start, activeSched.break_end
          );
        }

        let free = slots.filter(s => !taken.includes(s));

        if (dateStr === toYMD(new Date())) {
          const now = new Date();
          const nowMin = now.getHours() * 60 + now.getMinutes() + 10;
          free = free.filter(s => {
            const [h, m] = s.split(':').map(Number);
            return h * 60 + m > nowMin;
          });
        }

        setAvailableSlots(free);
      } catch (e) {
        console.error('Error fetching slots:', e);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedService, selectedBarber, slug]);

  const toYMD = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const buildSlots = (start: string, end: string, dur: number, bs?: string | null, be?: string | null) => {
    const s0 = toMin(start), e0 = toMin(end);
    const bs0 = bs ? toMin(bs) : null, be0 = be ? toMin(be) : null;
    const out: string[] = [];
    for (let m = s0; m + dur <= e0; m += dur) {
      if (bs0 !== null && be0 !== null && m >= bs0 && m < be0) continue;
      out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
    }
    return out;
  };

  const isDateDisabled = (date: Date) => {
    const str = toYMD(date);
    if (shopData.blocked_dates.some(bd => bd.blocked_date.substring(0, 10) === str)) return true;
    const dow = date.getDay();
    return !getRelevantSchedules(selectedBarber).some(s => s.weekday === dow && s.is_active);
  };

  const next14 = () => {
    const days: Date[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(); d.setDate(d.getDate() + i); days.push(d);
    }
    return days;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot) return;
    try {
      setBookingLoading(true);
      const { data, error: rpcErr } = await supabase.rpc('public_create_appointment', {
        shop_slug:   slug,
        service_id:  selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        date:        toYMD(selectedDate),
        start_time:  `${selectedTimeSlot}:00`,
        p_barber_id: selectedBarber?.id ?? null,
      });
      if (rpcErr) throw rpcErr;
      const res: any = data ? (typeof data === 'string' ? JSON.parse(data) : data) : {};
      if (res.ok || res.id) {
        setBookingSuccess(res.id || 'ok');
      } else {
        throw new Error(res.error || 'No se pudo crear la cita. Intenta otro horario.');
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar la cita');
    } finally {
      setBookingLoading(false);
    }
  };

  const resetAll = () => {
    setBookingSuccess(null);
    setSelectedBarber(isEquipoShop && shopData.barbers.length === 1 ? shopData.barbers[0] : null);
    setSelectedService(null); setSelectedDate(null); setSelectedTimeSlot(null);
    setClientName(''); setClientPhone('');
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-success/5 blur-xl -z-10" />
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-sora text-2xl font-bold mb-2">¡Reserva Confirmada!</h1>
          <p className="text-text-secondary text-sm mb-6">
            Tu cita ha sido agendada en <strong>{shop.name}</strong>.
          </p>
          <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 text-left mb-6 flex flex-col gap-4 text-sm">
            <Row label="Servicio" value={selectedService?.name} color={activeColor} />
            {selectedBarber && <Row label="Barbero" value={selectedBarber.full_name} />}
            <Row label="Fecha" value={selectedDate?.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })?.toUpperCase()} />
            <Row label="Hora" value={`${selectedTimeSlot} hrs`} color={activeColor} bold />
            {shop.address && (
              <div className="flex flex-col gap-1 pt-3 border-t border-white/5">
                <span className="text-text-secondary text-xs">Dirección:</span>
                <span className="text-xs flex items-start gap-1.5 text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: activeColor }} />
                  {shop.address}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {shop.phone && (
              <a
                href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(shop.name)},%20tengo%20una%20cita%20confirmada%20el%20${selectedDate?.toLocaleDateString('es-ES')}%20a%20las%20${selectedTimeSlot}%20para%20${selectedService?.name}.`}
                target="_blank" rel="noopener noreferrer"
                className="w-full bg-success hover:bg-success/90 text-white font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                Confirmar por WhatsApp
              </a>
            )}
            <button onClick={resetAll}
              className="w-full bg-surface-light hover:bg-white/10 text-text-primary font-semibold py-4 rounded-xl border border-white/5 transition-all text-sm">
              Agendar Otra Cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking form (shared between mobile inline + desktop sidebar) ──────────
  const BookingForm = () => (
    <form onSubmit={handleBooking} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bfName" className="text-xs text-text-secondary font-medium pl-1">Tu Nombre</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input required type="text" id="bfName" value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Ej: Alejandro Pérez"
            className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bfPhone" className="text-xs text-text-secondary font-medium pl-1">WhatsApp</label>
        <div className="relative">
          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input required type="tel" id="bfPhone" value={clientPhone}
            onChange={e => setClientPhone(e.target.value)}
            placeholder="+56912345678"
            className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium" />
        </div>
      </div>
      <button type="submit" disabled={bookingLoading}
        className="w-full text-background font-bold py-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg"
        style={{ backgroundColor: activeColor, boxShadow: `0 8px 20px -4px ${activeColor}40` }}>
        {bookingLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" />Agendando...</>
          : <>Confirmar Reserva <ChevronRight className="w-4 h-4" /></>}
      </button>
    </form>
  );

  // ── Summary mini-card (used in sidebar + mobile form header) ──────────────
  const SummaryCard = () => (
    <div className="flex flex-col gap-3 bg-surface-dark/60 border border-white/5 p-4 rounded-2xl text-sm">
      {selectedService ? (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold" style={{ color: activeColor }}>{selectedService.name}</span>
            <div className="flex justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedService.duration_min} min</span>
              <span className="font-sora font-bold text-text-primary">${selectedService.price}</span>
            </div>
          </div>
          {selectedBarber && (
            <div className="border-t border-white/5 pt-2.5 text-xs">
              <span className="text-text-secondary">Barbero: </span>
              <span className="font-semibold">{selectedBarber.full_name}</span>
            </div>
          )}
          {selectedDate && (
            <div className="border-t border-white/5 pt-2.5 text-xs">
              <span className="text-text-secondary">Fecha: </span>
              <span className="font-semibold uppercase">
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          )}
          {selectedTimeSlot && (
            <div className="border-t border-white/5 pt-2.5 text-xs">
              <span className="text-text-secondary">Hora: </span>
              <span className="font-bold text-sm" style={{ color: activeColor }}>{selectedTimeSlot} hrs</span>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-text-secondary">
          {isEquipoWithBarbers && !selectedBarber
            ? 'Elige un barbero para comenzar.'
            : 'Selecciona un servicio para comenzar.'}
        </p>
      )}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-gold selection:text-background font-inter pb-28 md:pb-16">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-80 h-80 rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: activeColor }} />
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 py-3.5">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {shop.logo_url ? (
              <div className="relative w-9 h-9 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 bg-surface-dark">
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="36px" />
              </div>
            ) : (
              <div className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${activeColor}15`, border: `1px solid ${activeColor}30` }}>
                <Scissors className="w-4 h-4 rotate-90" style={{ color: activeColor }} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-sora text-sm font-bold truncate">{shop.name}</h1>
              {shop.address && (
                <p className="text-[10px] text-text-secondary flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {shop.address.length > 40 ? `${shop.address.slice(0, 40)}…` : shop.address}
                </p>
              )}
            </div>
          </div>
          {shop.phone && (
            <a href={`tel:${shop.phone}`}
              className="flex-shrink-0 p-2.5 rounded-xl bg-surface-light border border-white/5 text-text-secondary hover:text-text-primary active:scale-95 transition-all">
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="w-full relative overflow-hidden" style={{ height: '220px' }}>
        {shop.logo_url ? (
          <>
            <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${activeColor}20 0%, transparent 70%)` }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-extrabold font-sora"
              style={{ backgroundColor: `${activeColor}20`, color: activeColor, border: `2px solid ${activeColor}40` }}>
              {shop.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 max-w-4xl mx-auto">
          <h2 className="font-sora text-2xl sm:text-3xl font-extrabold drop-shadow-lg">{shop.name}</h2>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-4 mt-6 relative z-10 grid md:grid-cols-12 gap-5 items-start">

        {/* Left column: steps */}
        <div className="md:col-span-8 flex flex-col gap-5">

          {/* STEP: Barber (equipo 2+ barbers only) */}
          {showBarberStep && (
            <StepCard step={1} title="Elige tu Barbero" activeColor={activeColor}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shopData.barbers.map(barber => {
                  const isSel = selectedBarber?.id === barber.id;
                  return (
                    <button key={barber.id}
                      onClick={() => { setSelectedBarber(barber); setSelectedService(null); setSelectedDate(null); setSelectedTimeSlot(null); }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-3 active:scale-95 ${
                        isSel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 hover:bg-surface-light/30'
                      }`}
                      style={{ borderColor: isSel ? activeColor : undefined }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${activeColor}20`, color: activeColor, border: `1px solid ${activeColor}40` }}>
                        {barber.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-sora font-semibold text-sm">{barber.full_name}</span>
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* STEP: Service */}
          {(!showBarberStep || selectedBarber) && (
            <StepCard step={sN(2)} title="Selecciona un Servicio" activeColor={activeColor}>
              {visibleServices.length === 0 ? (
                <div className="py-6 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-50" style={{ color: activeColor }} />
                  {isEquipoWithBarbers && selectedBarber
                    ? 'Este barbero aún no tiene servicios configurados.'
                    : 'No hay servicios disponibles.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleServices.map(service => {
                    const isSel = selectedService?.id === service.id;
                    return (
                      <button key={service.id}
                        onClick={() => { setSelectedService(service); setSelectedDate(null); setSelectedTimeSlot(null); }}
                        className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between active:scale-95 ${
                          isSel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 hover:bg-surface-light/30'
                        }`}
                        style={{ borderColor: isSel ? activeColor : undefined, minHeight: '96px' }}>
                        <span className="font-sora font-bold text-sm leading-snug">{service.name}</span>
                        <div className="flex justify-between items-end mt-3">
                          <span className="text-xs text-text-secondary flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{service.duration_min} min
                          </span>
                          <span className="font-sora font-extrabold text-base" style={{ color: activeColor }}>
                            ${service.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </StepCard>
          )}

          {/* STEP: Date */}
          {selectedService && (!isEquipoWithBarbers || selectedBarber) && (
            <StepCard step={sN(3)} title="Selecciona Fecha" activeColor={activeColor}>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                {next14().map((date, idx) => {
                  const isToday    = idx === 0;
                  const isDisabled = isDateDisabled(date);
                  const isSel      = selectedDate && toYMD(selectedDate) === toYMD(date);
                  return (
                    <button key={idx} disabled={isDisabled}
                      onClick={() => { setSelectedDate(date); setSelectedTimeSlot(null); }}
                      className={`flex-shrink-0 w-16 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 py-3 ${
                        isDisabled
                          ? 'opacity-20 cursor-not-allowed border-transparent bg-transparent'
                          : isSel
                            ? 'bg-surface-light shadow-lg'
                            : 'bg-surface-dark/60 border-white/5 hover:bg-surface-light/30 text-text-secondary hover:text-text-primary'
                      }`}
                      style={{ borderColor: isSel ? activeColor : undefined }}>
                      <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        {date.toLocaleDateString('es-ES', { weekday: 'short' }).slice(0, 3)}
                      </span>
                      <span className="font-sora text-xl font-bold">{date.getDate()}</span>
                      {isToday && !isDisabled && (
                        <span className="text-[8px] font-bold uppercase mt-0.5" style={{ color: activeColor }}>Hoy</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </StepCard>
          )}

          {/* STEP: Time */}
          {selectedService && selectedDate && (!isEquipoWithBarbers || selectedBarber) && (
            <StepCard step={sN(4)} title="Selecciona Hora" activeColor={activeColor}>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: activeColor }} />
                  <span className="text-xs text-text-secondary">Calculando disponibilidad…</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle className="w-5 h-5 mx-auto mb-2 opacity-60" style={{ color: activeColor }} />
                  Sin horarios disponibles para esta fecha.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableSlots.map(slot => {
                    const isSel = selectedTimeSlot === slot;
                    return (
                      <button key={slot}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-3 rounded-xl border text-center font-sora font-semibold text-sm transition-all active:scale-95 ${
                          isSel ? 'bg-surface-light shadow-lg' : 'bg-surface-dark/60 border-white/5 text-text-secondary hover:bg-surface-light/30'
                        }`}
                        style={{ borderColor: isSel ? activeColor : undefined }}>
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </StepCard>
          )}

          {/* ── Mobile: Confirm form (inline after time selection) ── */}
          {selectedService && selectedDate && selectedTimeSlot && (
            <div ref={formRef} className="md:hidden glass border border-white/5 rounded-3xl p-5 shadow-xl">
              <h3 className="font-sora text-base font-bold mb-4">Confirmar Reserva</h3>
              <SummaryCard />
              <div className="mt-4">
                <BookingForm />
              </div>
            </div>
          )}
        </div>

        {/* ── Desktop: sticky sidebar ── */}
        <div className="hidden md:flex md:col-span-4 md:sticky md:top-24 flex-col">
          <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-5">
            <h3 className="font-sora text-base font-bold">Detalle del Agendamiento</h3>
            <SummaryCard />
            {selectedService && selectedDate && selectedTimeSlot && (
              <div className="border-t border-white/5 pt-5">
                <BookingForm />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Helper UI components ───────────────────────────────────────────────────

function StepCard({ step, title, activeColor, children }: {
  step: number; title: string; activeColor: string; children: React.ReactNode;
}) {
  return (
    <div className="glass border border-white/5 rounded-3xl p-5 shadow-xl">
      <h2 className="font-sora text-base font-bold mb-4 flex items-center gap-2.5">
        <span className="w-6 h-6 flex-shrink-0 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center"
          style={{ color: activeColor }}>
          {step}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, color, bold }: {
  label: string; value?: string; color?: string; bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center pb-3 border-b border-white/5 last:pb-0 last:border-0 text-xs">
      <span className="text-text-secondary">{label}:</span>
      <span className={`${bold ? 'text-sm font-bold' : 'font-semibold'}`} style={color ? { color } : {}}>
        {value}
      </span>
    </div>
  );
}
