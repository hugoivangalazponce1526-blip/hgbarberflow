/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
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

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const isEquipoWithBarbers =
    shopData.barbershop.plan_type === 'equipo' && shopData.barbers.length > 1;

  // Fetch taken slots when date & service are selected
  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    const currentDate = selectedDate;
    const currentService = selectedService;
    const currentBarber = selectedBarber;

    async function fetchTakenSlotsAndGenerate() {
      try {
        setSlotsLoading(true);
        const dateStr = formatDateToYYYYMMDD(currentDate);

        const { data, error: rpcError } = await supabase.rpc('public_get_taken_slots', {
          shop_slug: slug,
          the_date: dateStr,
          p_barber_id: currentBarber?.id ?? null,
        });

        if (rpcError) throw rpcError;

        let rawTaken: any[] = [];
        if (data) {
          rawTaken = typeof data === 'string' ? JSON.parse(data) : data;
        }

        const normalizedTaken = rawTaken.map((t: any) => {
          const timeStr = typeof t === 'string' ? t : t.start_time || t.time || '';
          return timeStr.substring(0, 5);
        });

        const dayOfWeek = currentDate.getDay();
        const activeSchedule = shopData.schedules.find(
          (s: Schedule) => s.weekday === dayOfWeek && s.is_active
        );

        if (!activeSchedule) {
          setAvailableSlots([]);
          return;
        }

        let slots: string[];
        if (activeSchedule.custom_slots && activeSchedule.custom_slots.length > 0) {
          slots = activeSchedule.custom_slots;
        } else {
          slots = generateTimeSlots(
            activeSchedule.start_time,
            activeSchedule.end_time,
            currentService.duration_min,
            activeSchedule.break_start,
            activeSchedule.break_end
          );
        }

        let freeSlots = slots.filter((slot) => !normalizedTaken.includes(slot));

        const todayStr = formatDateToYYYYMMDD(new Date());
        if (dateStr === todayStr) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const bufferMin = 10;
          freeSlots = freeSlots.filter((slot) => {
            const parts = slot.split(':');
            const slotMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            return slotMin > currentMinutes + bufferMin;
          });
        }

        setAvailableSlots(freeSlots);
      } catch (err) {
        console.error('Error fetching taken slots:', err);
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchTakenSlotsAndGenerate();
  }, [selectedDate, selectedService, selectedBarber, shopData.schedules, slug, supabase]);

  const formatDateToYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const timeToMinutes = (timeStr: string) => {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const generateTimeSlots = (
    start: string,
    end: string,
    duration: number,
    breakStart?: string | null,
    breakEnd?: string | null
  ) => {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const breakStartMin = breakStart ? timeToMinutes(breakStart) : null;
    const breakEndMin = breakEnd ? timeToMinutes(breakEnd) : null;
    const slots: string[] = [];

    for (let min = startMin; min + duration <= endMin; min += duration) {
      if (
        breakStartMin !== null &&
        breakEndMin !== null &&
        min >= breakStartMin &&
        min < breakEndMin
      )
        continue;
      const hours = Math.floor(min / 60);
      const minutes = min % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
    return slots;
  };

  const isDateDisabled = (date: Date) => {
    const dateStr = formatDateToYYYYMMDD(date);
    const isBlocked = shopData.blocked_dates.some(
      (bd) => bd.blocked_date.substring(0, 10) === dateStr
    );
    if (isBlocked) return true;

    const dayOfWeek = date.getDay();
    const hasSchedule = shopData.schedules.some(
      (s) => s.weekday === dayOfWeek && s.is_active
    );
    return !hasSchedule;
  };

  const getNext14Days = () => {
    const dates: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTimeSlot || !clientName || !clientPhone)
      return;

    try {
      setBookingLoading(true);
      const dateStr = formatDateToYYYYMMDD(selectedDate);
      const startTimeFormatted = `${selectedTimeSlot}:00`;

      const { data, error: rpcError } = await supabase.rpc('public_create_appointment', {
        shop_slug: slug,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        date: dateStr,
        start_time: startTimeFormatted,
        p_barber_id: selectedBarber?.id ?? null,
      });

      if (rpcError) throw rpcError;

      let response: any = {};
      if (data) {
        response = typeof data === 'string' ? JSON.parse(data) : data;
      }

      if (response.ok || response.id) {
        setBookingSuccess(response.id || 'ok');
      } else {
        throw new Error(
          response.error || 'No se pudo crear la cita. Por favor intenta otro horario.'
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar la cita');
    } finally {
      setBookingLoading(false);
    }
  };

  const shop = shopData.barbershop;
  const activeColor = shop.brand_color || '#C9A84C';

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-success/5 blur-xl -z-10" />
          <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-sora text-2xl font-bold mb-2">¡Reserva Confirmada!</h1>
          <p className="text-text-secondary text-sm mb-6 font-inter">
            Tu cita ha sido agendada con éxito en <strong>{shop.name}</strong>.
          </p>
          <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 text-left mb-6 flex flex-col gap-4 font-inter text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-text-secondary">Servicio:</span>
              <span className="font-semibold">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-text-secondary">Fecha:</span>
              <span className="font-semibold uppercase text-xs">
                {selectedDate?.toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-text-secondary">Hora:</span>
              <span className="font-sora font-bold text-sm" style={{ color: activeColor }}>
                {selectedTimeSlot} hrs
              </span>
            </div>
            {shop.address && (
              <div className="flex flex-col gap-1.5">
                <span className="text-text-secondary">Dirección:</span>
                <span className="font-medium text-xs flex items-start gap-1.5 text-text-secondary">
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: activeColor }} />
                  {shop.address}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {shop.phone && (
              <a
                href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(shop.name)},%20tengo%20una%20cita%20confirmada%20el%20${selectedDate?.toLocaleDateString('es-ES')}%20a%20las%20${selectedTimeSlot}%20para%20${selectedService?.name}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-success hover:bg-success/90 text-white font-bold py-3.5 rounded-xl transition-all font-sora text-sm flex items-center justify-center gap-2"
              >
                Contactar por WhatsApp
              </a>
            )}
            <button
              onClick={() => {
                setBookingSuccess(null);
                setSelectedService(null);
                setSelectedBarber(null);
                setSelectedDate(null);
                setSelectedTimeSlot(null);
                setClientName('');
                setClientPhone('');
              }}
              className="w-full bg-surface-light hover:bg-white/10 text-text-primary font-semibold py-3.5 rounded-xl border border-white/5 transition-all text-sm font-sora"
            >
              Agendar Otra Cita
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-gold selection:text-background font-inter pb-20">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[400px] pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-10%] left-[20%] w-[350px] h-[350px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: activeColor }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop.logo_url ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-surface-dark">
                <Image src={shop.logo_url} alt={shop.name} fill className="object-cover" sizes="40px" />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5"
                style={{ backgroundColor: `${activeColor}15`, borderColor: `${activeColor}30` }}
              >
                <Scissors className="w-5 h-5 rotate-90" style={{ color: activeColor }} />
              </div>
            )}
            <div>
              <h1 className="font-sora text-base font-bold tracking-tight">{shop.name}</h1>
              {shop.address && (
                <p className="text-[10px] text-text-secondary flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shop.address.length > 35
                    ? `${shop.address.substring(0, 35)}...`
                    : shop.address}
                </p>
              )}
            </div>
          </div>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="p-2.5 rounded-xl bg-surface-light hover:bg-white/10 border border-white/5 text-text-secondary hover:text-text-primary transition-all"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </header>

      {/* Hero Banner */}
      <div className="w-full relative overflow-hidden" style={{ height: '260px' }}>
        {shop.logo_url ? (
          <>
            <Image
              src={shop.logo_url}
              alt={shop.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${activeColor}25 0%, transparent 70%)` }}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-extrabold font-sora"
              style={{
                backgroundColor: `${activeColor}20`,
                color: activeColor,
                border: `2px solid ${activeColor}40`,
              }}
            >
              {shop.name.substring(0, 1).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 max-w-4xl mx-auto">
          <h2 className="font-sora text-3xl sm:text-4xl font-extrabold text-text-primary drop-shadow-lg">
            {shop.name}
          </h2>
          {shop.address && (
            <p className="text-text-secondary text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: activeColor }} />
              {shop.address}
            </p>
          )}
        </div>
      </div>

      {/* Main Flow */}
      <main className="max-w-4xl mx-auto px-4 mt-8 relative z-10 grid md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Step 1: Services */}
          <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl">
            <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Selecciona un Servicio
            </h2>
            {shopData.services.length === 0 ? (
              <p className="text-sm text-text-secondary font-inter">
                No hay servicios disponibles temporalmente.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {shopData.services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
                        setSelectedBarber(null);
                        setSelectedDate(null);
                        setSelectedTimeSlot(null);
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between h-28 ${
                        isSelected
                          ? 'bg-surface-light border-gold shadow-lg shadow-gold/5'
                          : 'bg-surface-dark/60 border-white/5 hover:border-white/10 hover:bg-surface-light/30'
                      }`}
                      style={{ borderColor: isSelected ? activeColor : undefined }}
                    >
                      <span className="font-sora font-bold text-sm">{service.name}</span>
                      <div className="flex justify-between items-end w-full">
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {service.duration_min} min
                        </span>
                        <span
                          className="font-sora font-extrabold text-base text-gold"
                          style={{ color: activeColor }}
                        >
                          ${service.price}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Barber (equipo plan only) */}
          {selectedService && isEquipoWithBarbers && (
            <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in">
              <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                Elige tu Barbero
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {shopData.barbers.map((barber) => {
                  const isSelected = selectedBarber?.id === barber.id;
                  return (
                    <button
                      key={barber.id}
                      onClick={() => {
                        setSelectedBarber(barber);
                        setSelectedDate(null);
                        setSelectedTimeSlot(null);
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-surface-light border-gold shadow-lg shadow-gold/5'
                          : 'bg-surface-dark/60 border-white/5 hover:border-white/10 hover:bg-surface-light/30'
                      }`}
                      style={{ borderColor: isSelected ? activeColor : undefined }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: `${activeColor}20`, color: activeColor, border: `1px solid ${activeColor}40` }}
                      >
                        {barber.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-sora font-semibold text-sm">{barber.full_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 (or 2): Date */}
          {selectedService && (!isEquipoWithBarbers || selectedBarber) && (
            <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in">
              <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">
                  {isEquipoWithBarbers ? 3 : 2}
                </span>
                Selecciona Fecha
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-4">
                {getNext14Days().map((date, idx) => {
                  const isToday = idx === 0;
                  const isDisabled = isDateDisabled(date);
                  const isSelected =
                    selectedDate &&
                    formatDateToYYYYMMDD(selectedDate) === formatDateToYYYYMMDD(date);
                  return (
                    <button
                      key={idx}
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTimeSlot(null);
                      }}
                      className={`flex-shrink-0 w-16 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                        isDisabled
                          ? 'opacity-20 cursor-not-allowed border-transparent bg-transparent'
                          : isSelected
                          ? 'bg-surface-light border-gold text-text-primary shadow-lg shadow-gold/5'
                          : 'bg-surface-dark/60 border-white/5 text-text-secondary hover:border-white/10 hover:bg-surface-light/30 hover:text-text-primary'
                      }`}
                      style={{ borderColor: isSelected ? activeColor : undefined }}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider mb-1">
                        {date
                          .toLocaleDateString('es-ES', { weekday: 'short' })
                          .substring(0, 3)}
                      </span>
                      <span className="font-sora text-xl font-bold">{date.getDate()}</span>
                      {isToday && !isDisabled && (
                        <span
                          className="text-[8px] font-bold uppercase mt-1"
                          style={{ color: activeColor }}
                        >
                          Hoy
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4 (or 3): Slots */}
          {selectedService && selectedDate && (!isEquipoWithBarbers || selectedBarber) && (
            <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in">
              <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">
                  {isEquipoWithBarbers ? 4 : 3}
                </span>
                Selecciona Hora
              </h2>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: activeColor }}
                  />
                  <span className="text-xs text-text-secondary">
                    Calculando slots disponibles...
                  </span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle
                    className="w-5 h-5 mx-auto mb-2 opacity-60"
                    style={{ color: activeColor }}
                  />
                  No quedan turnos disponibles para este servicio en la fecha seleccionada.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`py-3.5 rounded-xl border text-center font-sora font-semibold text-xs sm:text-sm transition-all ${
                          isSelected
                            ? 'bg-surface-light border-gold text-text-primary shadow-lg shadow-gold/5'
                            : 'bg-surface-dark/60 border-white/5 text-text-secondary hover:border-white/10 hover:bg-surface-light/30'
                        }`}
                        style={{ borderColor: isSelected ? activeColor : undefined }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Summary */}
        <div className="md:col-span-4 sticky top-28">
          <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="font-sora text-base font-bold">Detalle del Agendamiento</h3>
            <div className="flex flex-col gap-4 bg-surface-dark/60 border border-white/5 p-4 rounded-2xl">
              {selectedService ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold" style={{ color: activeColor }}>
                    {selectedService.name}
                  </span>
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Duración: {selectedService.duration_min} min</span>
                    <span className="font-sora font-extrabold text-sm text-text-primary">
                      ${selectedService.price}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed font-inter">
                  Selecciona un servicio para comenzar a agendar tu turno.
                </p>
              )}
              {selectedBarber && (
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Barbero:</span>
                  <span className="font-semibold text-text-primary">{selectedBarber.full_name}</span>
                </div>
              )}
              {selectedDate && (
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Fecha de cita:</span>
                  <span className="font-semibold text-text-primary uppercase">
                    {selectedDate.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
              )}
              {selectedTimeSlot && (
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Hora de cita:</span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: activeColor }}
                  >
                    {selectedTimeSlot} hrs
                  </span>
                </div>
              )}
            </div>

            {selectedService && selectedDate && selectedTimeSlot && (
              <form onSubmit={handleBooking} className="flex flex-col gap-4 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="clientName"
                    className="text-xs text-text-secondary font-medium pl-1"
                  >
                    Tu Nombre
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      required
                      type="text"
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej: Alejandro Pérez"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="clientPhone"
                    className="text-xs text-text-secondary font-medium pl-1"
                  >
                    WhatsApp (Teléfono)
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      required
                      type="tel"
                      id="clientPhone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ej: +56912345678"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full text-background font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
                  style={{
                    backgroundColor: activeColor,
                    boxShadow: `0 10px 15px -3px ${activeColor}20`,
                  }}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-background" />
                      Agendando cita...
                    </>
                  ) : (
                    <>
                      Confirmar Reserva
                      <ChevronRight className="w-4 h-4 text-background" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
