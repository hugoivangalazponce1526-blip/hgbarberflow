/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Loader2
} from 'lucide-react';

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price: number;
  is_active: boolean;
}

interface Schedule {
  id: string;
  weekday: number; // 0-6 (0 is Sunday, 1 is Monday, etc.)
  start_time: string; // e.g. "09:00:00"
  end_time: string; // e.g. "18:00:00"
  is_active: boolean;
  break_start?: string | null;
  break_end?: string | null;
}

interface BlockedDate {
  id: string;
  blocked_date: string; // e.g. "2026-06-15"
  reason: string | null;
}

interface ShopData {
  barbershop: Barbershop;
  services: Service[];
  schedules: Schedule[];
  blocked_dates: BlockedDate[];
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = createClient();

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);

  // Form Flow States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Booking Execution States
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null); // holds appointment ID

  // Slots calculation
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Fetch shop data
  useEffect(() => {
    async function fetchShop() {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: rpcError } = await supabase.rpc('public_get_shop', { shop_slug: slug });
        
        if (rpcError) {
          throw new Error(rpcError.message);
        }
        
        if (!data) {
          throw new Error('No se encontró información para esta barbería');
        }

        // Resilient parsing of JSON response
        let parsedData: any = null;
        if (typeof data === 'string') {
          parsedData = JSON.parse(data);
        } else {
          parsedData = data;
        }

        const shop = parsedData.barbershop || parsedData.shop || parsedData.details;
        
        if (!shop || shop.is_active === false) {
          throw new Error('Esta barbería no se encuentra activa temporalmente');
        }

        setShopData({
          barbershop: shop,
          services: parsedData.services || parsedData.active_services || [],
          schedules: parsedData.schedules || parsedData.active_schedules || [],
          blocked_dates: parsedData.blocked_dates || parsedData.blocked_dates_future || []
        });

      } catch (err: any) {
        console.error('Error fetching shop details:', err);
        setError(err.message || 'Error al conectar con la barbería');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchShop();
    }
  }, [slug, supabase]);

  // Fetch taken slots when date & service are selected
  useEffect(() => {
    if (!shopData || !selectedDate || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    const currentDate = selectedDate;
    const currentService = selectedService;

    async function fetchTakenSlotsAndGenerate() {
      try {
        setSlotsLoading(true);
        const dateStr = formatDateToYYYYMMDD(currentDate);
        
        // Fetch taken slots from Supabase RPC
        const { data, error: rpcError } = await supabase.rpc('public_get_taken_slots', {
          shop_slug: slug,
          the_date: dateStr
        });

        if (rpcError) throw rpcError;

        let rawTaken: any[] = [];
        if (data) {
          rawTaken = typeof data === 'string' ? JSON.parse(data) : data;
        }

        // Normalize taken slots to HH:MM format
        const normalizedTaken = rawTaken.map((t: any) => {
          const timeStr = typeof t === 'string' ? t : (t.start_time || t.time || '');
          return timeStr.substring(0, 5); // extracts "HH:MM"
        });


        // Generate all slots and filter
        const dayOfWeek = currentDate.getDay();
        const activeSchedule = shopData!.schedules.find(
          s => s.weekday === dayOfWeek && s.is_active
        );

        if (!activeSchedule) {
          setAvailableSlots([]);
          return;
        }

        const slots = generateTimeSlots(
          activeSchedule.start_time,
          activeSchedule.end_time,
          currentService.duration_min,
          activeSchedule.break_start,
          activeSchedule.break_end
        );

        // Filter out taken slots
        let freeSlots = slots.filter(slot => !normalizedTaken.includes(slot));

        // If selected date is TODAY, filter out past slots in local time
        const todayStr = formatDateToYYYYMMDD(new Date());
        if (dateStr === todayStr) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const bufferMin = 10; // 10 minutes buffer for booking
          
          freeSlots = freeSlots.filter(slot => {
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

  }, [selectedDate, selectedService, shopData, slug, supabase]);

  // Helpers
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

  const generateTimeSlots = (start: string, end: string, duration: number, breakStart?: string | null, breakEnd?: string | null) => {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const breakStartMin = breakStart ? timeToMinutes(breakStart) : null;
    const breakEndMin = breakEnd ? timeToMinutes(breakEnd) : null;
    const slots: string[] = [];

    for (let min = startMin; min + duration <= endMin; min += duration) {
      if (breakStartMin !== null && breakEndMin !== null && min >= breakStartMin && min < breakEndMin) continue;
      const hours = Math.floor(min / 60);
      const minutes = min % 60;
      slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
    return slots;
  };

  // Check if date is blocked or has no active schedule
  const isDateDisabled = (date: Date) => {
    if (!shopData) return true;
    
    // Check blocked_dates
    const dateStr = formatDateToYYYYMMDD(date);
    const isBlocked = shopData.blocked_dates.some(
      bd => bd.blocked_date.substring(0, 10) === dateStr
    );
    if (isBlocked) return true;

    // Check schedules
    const dayOfWeek = date.getDay();
    const hasSchedule = shopData.schedules.some(
      s => s.weekday === dayOfWeek && s.is_active
    );
    if (!hasSchedule) return true;

    return false;
  };

  // Generate 14 days of date objects for scheduling
  const getNext14Days = () => {
    const dates: Date[] = [];
    const now = new Date();
    // Start from today
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(now.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopData || !selectedService || !selectedDate || !selectedTimeSlot || !clientName || !clientPhone) {
      return;
    }

    try {
      setBookingLoading(true);
      const dateStr = formatDateToYYYYMMDD(selectedDate);
      // Format start_time with seconds for PostgreSQL compatibility: HH:MM:00
      const startTimeFormatted = `${selectedTimeSlot}:00`;

      const { data, error: rpcError } = await supabase.rpc('public_create_appointment', {
        shop_slug: slug,
        service_id: selectedService.id,
        client_name: clientName,
        client_phone: clientPhone,
        date: dateStr,
        start_time: startTimeFormatted
      });

      if (rpcError) throw rpcError;

      let response: any = {};
      if (data) {
        response = typeof data === 'string' ? JSON.parse(data) : data;
      }

      if (response.ok || response.id) {
        setBookingSuccess(response.id || 'ok');
      } else {
        throw new Error(response.error || 'No se pudo crear la cita. Por favor intenta otro horario.');
      }

    } catch (err: any) {
      alert(err.message || 'Error al guardar la cita');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="font-sora text-sm text-text-secondary">Cargando barbería...</p>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-danger" />
        </div>
        <h1 className="font-sora text-2xl font-bold mb-3">Barbería No Disponible</h1>
        <p className="text-text-secondary max-w-md mb-8 font-inter">
          {error || 'No pudimos encontrar la información de la barbería solicitada.'}
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

  const shop = shopData.barbershop;
  const activeColor = shop.brand_color || '#C9A84C'; // brand color or fallback gold

  // Success view
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
            Tu cita ha sido agendada con éxito en **{shop.name}**.
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
                  month: 'short' 
                })}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <span className="text-text-secondary">Hora:</span>
              <span className="font-semibold text-gold" style={{ color: activeColor }}>{selectedTimeSlot} hrs</span>
            </div>
            {shop.address && (
              <div className="flex flex-col gap-1.5">
                <span className="text-text-secondary">Dirección:</span>
                <span className="font-medium text-xs flex items-start gap-1.5 text-text-secondary">
                  <MapPin className="w-4 h-4 text-gold flex-shrink-0" style={{ color: activeColor }} />
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
      
      {/* Background glow decoration */}
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
                <Image 
                  src={shop.logo_url} 
                  alt={shop.name} 
                  fill 
                  className="object-cover"
                />
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
                  {shop.address.length > 35 ? `${shop.address.substring(0, 35)}...` : shop.address}
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
              style={{ backgroundColor: `${activeColor}20`, color: activeColor, border: `2px solid ${activeColor}40` }}
            >
              {shop.name.substring(0, 1).toUpperCase()}
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 max-w-4xl mx-auto">
          <h1 className="font-sora text-3xl sm:text-4xl font-extrabold text-text-primary drop-shadow-lg">{shop.name}</h1>
          {shop.address && (
            <p className="text-text-secondary text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: activeColor }} />
              {shop.address}
            </p>
          )}
        </div>
      </div>

      {/* Main Flow Grid */}
      <main className="max-w-4xl mx-auto px-4 mt-8 relative z-10 grid md:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Steps */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Step 1: Services */}
          <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl">
            <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">1</span>
              Selecciona un Servicio
            </h2>
            
            {shopData.services.length === 0 ? (
              <p className="text-sm text-text-secondary font-inter">No hay servicios disponibles temporalmente.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {shopData.services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => {
                        setSelectedService(service);
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
                      <span className={`font-sora font-bold text-sm ${isSelected ? 'text-text-primary' : 'text-text-primary'}`}>
                        {service.name}
                      </span>
                      <div className="flex justify-between items-end w-full">
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {service.duration_min} min
                        </span>
                        <span className="font-sora font-extrabold text-base text-gold" style={{ color: activeColor }}>
                          ${service.price}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Date Selection */}
          {selectedService && (
            <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in">
              <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">2</span>
                Selecciona Fecha
              </h2>
              
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-surface-light">
                {getNext14Days().map((date, idx) => {
                  const isToday = idx === 0;
                  const isDisabled = isDateDisabled(date);
                  const isSelected = selectedDate && formatDateToYYYYMMDD(selectedDate) === formatDateToYYYYMMDD(date);
                  
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
                        {date.toLocaleDateString('es-ES', { weekday: 'short' }).substring(0, 3)}
                      </span>
                      <span className="font-sora text-xl font-bold">
                        {date.getDate()}
                      </span>
                      {isToday && !isDisabled && (
                        <span className="text-[8px] font-bold text-gold uppercase mt-1" style={{ color: activeColor }}>
                          Hoy
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Slots Selection */}
          {selectedService && selectedDate && (
            <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl animate-fade-in">
              <h2 className="font-sora text-lg font-bold mb-4 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-surface-light border border-white/10 text-xs font-bold flex items-center justify-center">3</span>
                Selecciona Hora
              </h2>
              
              {slotsLoading ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" style={{ color: activeColor }} />
                  <span className="text-xs text-text-secondary">Calculando slots disponibles...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-8 text-center text-text-secondary text-sm border border-white/5 rounded-2xl bg-surface-dark/20">
                  <AlertTriangle className="w-5 h-5 text-gold mx-auto mb-2 opacity-60" style={{ color: activeColor }} />
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

        {/* Right column: Summary and Booking Details */}
        <div className="md:col-span-4 sticky top-28">
          <div className="glass border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
            <h3 className="font-sora text-base font-bold">Detalle del Agendamiento</h3>
            
            {/* Appointment State Summary */}
            <div className="flex flex-col gap-4 bg-surface-dark/60 border border-white/5 p-4.5 rounded-2xl">
              {selectedService ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-gold" style={{ color: activeColor }}>{selectedService.name}</span>
                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Duración: {selectedService.duration_min} min</span>
                    <span className="font-sora font-extrabold text-sm text-text-primary">${selectedService.price}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-secondary leading-relaxed font-inter">
                  Selecciona un servicio para comenzar a agendar tu turno.
                </p>
              )}

              {selectedDate && (
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Fecha de cita:</span>
                  <span className="font-semibold text-text-primary uppercase">
                    {selectedDate.toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
              )}

              {selectedTimeSlot && (
                <div className="border-t border-white/5 pt-3.5 flex flex-col gap-1.5 text-xs">
                  <span className="text-text-secondary font-medium">Hora de cita:</span>
                  <span className="font-bold text-gold text-sm" style={{ color: activeColor }}>
                    {selectedTimeSlot} hrs
                  </span>
                </div>
              )}
            </div>

            {/* Client Info form */}
            {selectedService && selectedDate && selectedTimeSlot && (
              <form onSubmit={handleBooking} className="flex flex-col gap-4.5 animate-fade-in">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="clientName" className="text-xs text-text-secondary font-medium pl-1">
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
                      style={{ focusBorderColor: activeColor } as any}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="clientPhone" className="text-xs text-text-secondary font-medium pl-1">
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
                  className="w-full text-background font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  style={{ backgroundColor: activeColor, boxShadow: `0 10px 15px -3px ${activeColor}20` }}
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
