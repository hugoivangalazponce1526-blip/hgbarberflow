/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Scissors,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Globe,
  Phone,
  MapPin,
  Loader2,
  DollarSign,
  CheckCircle,
  XCircle,
  CalendarDays,
  TrendingUp,
  Users,
  UserPlus,
  UserMinus
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  address: string | null;
  plan: string;
  plan_type: 'individual' | 'equipo';
  max_barberos: number;
  is_active: boolean;
}

interface TeamBarber {
  id: string;
  full_name: string;
  role: string;
}

interface Profile {
  id: string;
  barbershop_id: string;
  full_name: string;
  role: string;
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
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  barber_id: string | null;
  break_start: string | null;
  break_end: string | null;
  custom_slots: string[] | null;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

interface Appointment {
  id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  status: 'confirmada' | 'completada' | 'cancelada';
  created_at: string;
  services?: {
    name: string;
    price: number;
  };
}

const ALL_TIME_SLOTS = Array.from({ length: 30 }, (_, i) => {
  const totalMin = 7 * 60 + i * 30;
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
});

const SLOT_PRESETS: Record<string, string[]> = {
  mañana: ALL_TIME_SLOTS.filter(s => { const h = parseInt(s); return h >= 8 && h < 13; }),
  tarde:  ALL_TIME_SLOTS.filter(s => { const h = parseInt(s); return h >= 14 && h < 20; }),
  full:   ALL_TIME_SLOTS.filter(s => { const h = parseInt(s); return h >= 8 && h < 20; }),
  clear:  []
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth and Profile States
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);

  // Active Tab: 'appointments' | 'services' | 'schedule' | 'profile'
  const [activeTab, setActiveTab] = useState<'appointments' | 'stats' | 'services' | 'schedule' | 'profile' | 'equipo'>('appointments');

  // Team barbers (equipo plan only)
  const [teamBarbers, setTeamBarbers] = useState<TeamBarber[]>([]);
  const [showAddBarberForm, setShowAddBarberForm] = useState(false);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberEmail, setNewBarberEmail] = useState('');
  const [newBarberPassword, setNewBarberPassword] = useState('');
  const [addBarberLoading, setAddBarberLoading] = useState(false);
  const [addBarberError, setAddBarberError] = useState<string | null>(null);

  // Data States
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Loading States for Tabs
  const [tabLoading, setTabLoading] = useState(false);

  // Modals & Forms States
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'confirmada' | 'completada' | 'cancelada'>('all');
  
  // Service CRUD form
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState(30);
  const [servicePrice, setServicePrice] = useState(15);
  const [serviceIsActive, setServiceIsActive] = useState(true);

  // Blocked Date Form
  const [blockedDateStr, setBlockedDateStr] = useState('');
  const [blockedDateReason, setBlockedDateReason] = useState('');

  // Profile Form States
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopBrandColor, setShopBrandColor] = useState('#C9A84C');
  const [logoUploading, setLogoUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Validate Session and Load User Profile
  useEffect(() => {
    async function checkAuth() {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.replace('/login');
          return;
        }

        // Fetch profile
        const { data: userProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileErr || !userProfile) {
          // Sign out and redirect — profile missing means account is broken
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (userProfile.role !== 'barber') {
          if (userProfile.role === 'super_admin') {
            router.replace('/admin');
          } else {
            router.replace('/login');
          }
          return;
        }

        setProfile(userProfile);

        // Fetch Barbershop details
        const { data: shop, error: shopErr } = await supabase
          .from('barbershops')
          .select('*')
          .eq('id', userProfile.barbershop_id)
          .single();

        if (shopErr || !shop) {
          // Don't sign out — might be a temporary error; just redirect to login
          router.replace('/login');
          return;
        }

        setBarbershop({
          ...shop,
          plan_type: shop.plan_type ?? 'individual',
          max_barberos: shop.max_barberos ?? 1,
        });

        // Sync Profile form states
        setShopName(shop.name);
        setShopPhone(shop.phone || '');
        setShopAddress(shop.address || '');
        setShopBrandColor(shop.brand_color || '#C9A84C');

      } catch (err: any) {
        console.error('Auth check error:', err);
        router.replace('/login');
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, [supabase, router]);

  // Load Tab Data
  useEffect(() => {
    if (!profile) return;
    loadTabData();
  }, [profile, activeTab]);

  const loadTabData = async () => {
    try {
      setTabLoading(true);
      if (activeTab === 'appointments') {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, services(name, price)')
          .eq('barbershop_id', barbershop!.id)
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) throw error;
        setAppointments(data || []);

      } else if (activeTab === 'stats') {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, services(name, price)')
          .eq('barbershop_id', barbershop!.id)
          .neq('status', 'cancelada')
          .order('appointment_date', { ascending: true });
        if (error) throw error;
        setAppointments(data || []);

      } else if (activeTab === 'services') {
        let servQuery = supabase
          .from('services')
          .select('*')
          .eq('barbershop_id', barbershop!.id)
          .order('name', { ascending: true });

        // Equipo: each barber sees only their own services
        if (barbershop!.plan_type === 'equipo') {
          servQuery = servQuery.eq('barber_id', profile!.id);
        }

        const { data, error } = await servQuery;
        if (error) throw error;
        setServices(data || []);

      } else if (activeTab === 'schedule') {
        let schedQuery = supabase
          .from('schedules')
          .select('*')
          .eq('barbershop_id', barbershop!.id)
          .order('weekday', { ascending: true });

        // Equipo: each barber sees only their own schedules
        if (barbershop!.plan_type === 'equipo') {
          schedQuery = schedQuery.eq('barber_id', profile!.id);
        } else {
          schedQuery = schedQuery.is('barber_id', null);
        }

        const { data: scheduleData, error: scheduleErr } = await schedQuery;

        if (scheduleErr) throw scheduleErr;
        setSchedules(scheduleData || []);

        const { data: blockedData, error: blockedErr } = await supabase
          .from('blocked_dates')
          .select('*')
          .eq('barbershop_id', barbershop!.id)
          .order('blocked_date', { ascending: true });

        if (blockedErr) throw blockedErr;
        setBlockedDates(blockedData || []);

      } else if (activeTab === 'equipo') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('barbershop_id', barbershop!.id)
          .eq('role', 'barber')
          .order('full_name', { ascending: true });
        if (error) throw error;
        setTeamBarbers(data || []);
      }
    } catch (err: any) {
      console.error('Error loading tab data:', err);
    } finally {
      setTabLoading(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Appointment Actions
  const updateAppointmentStatus = async (id: string, newStatus: 'confirmada' | 'completada' | 'cancelada') => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      loadTabData(); // reload
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado de la cita');
    }
  };

  // Service CRUD handlers
  const openCreateServiceModal = () => {
    setEditingService(null);
    setServiceName('');
    setServiceDuration(30);
    setServicePrice(15);
    setServiceIsActive(true);
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceDuration(service.duration_min);
    setServicePrice(service.price);
    setServiceIsActive(service.is_active);
    setServiceModalOpen(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        // Update
        const { error } = await supabase
          .from('services')
          .update({
            name: serviceName,
            duration_min: serviceDuration,
            price: servicePrice,
            is_active: serviceIsActive
          })
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('services')
          .insert({
            barbershop_id: profile!.barbershop_id,
            name: serviceName,
            duration_min: serviceDuration,
            price: servicePrice,
            is_active: serviceIsActive,
            // Equipo: tag service to this barber
            ...(barbershop!.plan_type === 'equipo' && { barber_id: profile!.id }),
          });

        if (error) throw error;
      }

      setServiceModalOpen(false);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Error al guardar el servicio');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar servicio');
    }
  };

  // Blocked Dates Actions
  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedDateStr) return;

    try {
      const { error } = await supabase
        .from('blocked_dates')
        .insert({
          barbershop_id: profile!.barbershop_id,
          blocked_date: blockedDateStr,
          reason: blockedDateReason || null
        });

      if (error) throw error;
      setBlockedDateStr('');
      setBlockedDateReason('');
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Error al bloquear fecha');
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar bloqueo');
    }
  };

  // Schedule Save handler
  const handleScheduleChange = async (weekday: number, field: 'start_time' | 'end_time' | 'is_active' | 'break_start' | 'break_end', value: any) => {
    const existingIndex = schedules.findIndex(s => s.weekday === weekday);

    // Optimistic state update
    const updatedSchedules = [...schedules];

    if (existingIndex !== -1) {
      updatedSchedules[existingIndex] = {
        ...updatedSchedules[existingIndex],
        [field]: value
      };
      setSchedules(updatedSchedules);

      try {
        const item = updatedSchedules[existingIndex];
        const { error } = await supabase
          .from('schedules')
          .update({
            start_time: item.start_time,
            end_time: item.end_time,
            is_active: item.is_active,
            break_start: item.break_start || null,
            break_end: item.break_end || null
          })
          .eq('id', item.id);

        if (error) throw error;
      } catch (err: any) {
        alert(err.message || 'Error al actualizar horario');
        loadTabData(); // rollback
      }
    } else {
      // In case day has no schedule record, insert a new one
      const newSchedule = {
        barbershop_id: profile!.barbershop_id,
        ...(barbershop!.plan_type === 'equipo' && { barber_id: profile!.id }),
        weekday,
        start_time: field === 'start_time' ? value : '09:00:00',
        end_time: field === 'end_time' ? value : '18:00:00',
        is_active: field === 'is_active' ? value : true,
        break_start: null,
        break_end: null
      };

      try {
        const { error } = await supabase
          .from('schedules')
          .insert(newSchedule);

        if (error) throw error;
        loadTabData();
      } catch (err: any) {
        alert(err.message || 'Error al crear horario');
      }
    }
  };

  // Toggle a single time slot on/off for a weekday
  const handleSlotToggle = async (weekday: number, slotTime: string) => {
    const existingIndex = schedules.findIndex(s => s.weekday === weekday);
    const updatedSchedules = [...schedules];

    if (existingIndex !== -1) {
      const current = updatedSchedules[existingIndex];
      const currentSlots: string[] = Array.isArray(current.custom_slots) ? current.custom_slots : [];
      const newSlots = currentSlots.includes(slotTime)
        ? currentSlots.filter(s => s !== slotTime)
        : [...currentSlots, slotTime].sort();

      updatedSchedules[existingIndex] = { ...current, custom_slots: newSlots };
      setSchedules(updatedSchedules);

      try {
        const { error } = await supabase
          .from('schedules')
          .update({ custom_slots: newSlots })
          .eq('id', current.id);
        if (error) throw error;
      } catch (err: any) {
        alert(err.message || 'Error al actualizar horarios');
        loadTabData();
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .insert({
            barbershop_id: profile!.barbershop_id,
            ...(barbershop!.plan_type === 'equipo' && { barber_id: profile!.id }),
            weekday,
            start_time: '00:00:00',
            end_time: '23:59:00',
            is_active: true,
            custom_slots: [slotTime],
            break_start: null,
            break_end: null,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setSchedules([...schedules, data]);
      } catch (err: any) {
        alert(err.message || 'Error al crear horario');
      }
    }
  };

  // Apply a preset block of slots to a weekday
  const handleSetPreset = async (weekday: number, preset: keyof typeof SLOT_PRESETS) => {
    const newSlots = SLOT_PRESETS[preset];
    const existingIndex = schedules.findIndex(s => s.weekday === weekday);
    const updatedSchedules = [...schedules];

    if (existingIndex !== -1) {
      updatedSchedules[existingIndex] = { ...updatedSchedules[existingIndex], custom_slots: newSlots, is_active: newSlots.length > 0 };
      setSchedules(updatedSchedules);
      try {
        const item = updatedSchedules[existingIndex];
        const { error } = await supabase
          .from('schedules')
          .update({ custom_slots: newSlots, is_active: newSlots.length > 0 })
          .eq('id', item.id);
        if (error) throw error;
      } catch (err: any) {
        alert(err.message || 'Error al aplicar preset');
        loadTabData();
      }
    } else if (newSlots.length > 0) {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .insert({
            barbershop_id: profile!.barbershop_id,
            ...(barbershop!.plan_type === 'equipo' && { barber_id: profile!.id }),
            weekday,
            start_time: '00:00:00',
            end_time: '23:59:00',
            is_active: true,
            custom_slots: newSlots,
            break_start: null,
            break_end: null,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setSchedules([...schedules, data]);
      } catch (err: any) {
        alert(err.message || 'Error al crear horario');
      }
    }
  };

  // Profile Save Handler
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      const { error } = await supabase
        .from('barbershops')
        .update({
          name: shopName,
          phone: shopPhone,
          address: shopAddress,
          brand_color: shopBrandColor
        })
        .eq('id', barbershop!.id);

      if (error) throw error;

      // Update local state
      setBarbershop({
        ...barbershop!,
        name: shopName,
        phone: shopPhone,
        address: shopAddress,
        brand_color: shopBrandColor
      });

      alert('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      alert(err.message || 'Error al actualizar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  // File Upload to Supabase Storage
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploading(true);

      // Attempt to ensure public bucket 'logos' exists
      // If listing buckets fails due to RLS, it's fine, we try to upload
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === 'logos');
        if (!bucketExists) {
          await supabase.storage.createBucket('logos', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2 // 2MB
          });
        }
      } catch (bucketErr) {
        console.log('Skipping bucket check/creation:', bucketErr);
      }

      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${barbershop!.id}-${Math.floor(Date.now() / 1000)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update barbershop row
      const { error: dbErr } = await supabase
        .from('barbershops')
        .update({ logo_url: publicUrl })
        .eq('id', barbershop!.id);

      if (dbErr) throw dbErr;

      // Update local state
      setBarbershop({
        ...barbershop!,
        logo_url: publicUrl
      });

      alert('¡Logo subido e instalado con éxito!');

    } catch (err: any) {
      alert(err.message || 'Error al subir el logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbershop) return;
    if (teamBarbers.length >= barbershop.max_barberos) {
      setAddBarberError(`Límite alcanzado: tu plan permite hasta ${barbershop.max_barberos} barberos.`);
      return;
    }
    setAddBarberLoading(true);
    setAddBarberError(null);
    try {
      const res = await fetch('/api/dashboard/add-team-barber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newBarberName, email: newBarberEmail, password: newBarberPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al agregar barbero');
      setNewBarberName(''); setNewBarberEmail(''); setNewBarberPassword('');
      setShowAddBarberForm(false);
      loadTabData();
    } catch (err: any) {
      setAddBarberError(err.message);
    } finally {
      setAddBarberLoading(false);
    }
  };

  const handleRemoveBarber = async (barberId: string, barberName: string) => {
    if (!window.confirm(`¿Eliminar a "${barberName}" del equipo? Se eliminará su cuenta permanentemente.`)) return;
    try {
      const res = await fetch('/api/dashboard/remove-team-barber', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al eliminar barbero');
      loadTabData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center gap-4 font-inter">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="font-sora text-sm text-text-secondary">Autenticando panel...</p>
      </div>
    );
  }

  if (!profile || !barbershop) return null;

  // Render variables
  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/b/${barbershop.slug}`;
  const activeColor = barbershop.brand_color || '#C9A84C';

  return (
    <div className="bg-background text-text-primary font-inter overflow-x-hidden md:flex md:flex-row md:h-screen">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-surface-dark border-b md:border-b-0 md:border-r border-white/5 md:flex md:flex-col md:justify-between md:shrink-0 md:overflow-y-auto z-20">
        <div>
          {/* Header Sidebar */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5"
              style={{ backgroundColor: `${activeColor}15`, borderColor: `${activeColor}30` }}
            >
              <Scissors className="w-5 h-5 rotate-90" style={{ color: activeColor }} />
            </div>
            <div>
              <h2 className="font-sora text-sm font-bold truncate max-w-[130px]">{barbershop.name}</h2>
              <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">
                Socio {barbershop.plan}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 md:p-4 flex flex-row md:flex-col gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'appointments'
                  ? 'bg-surface-light text-text-primary md:border-l-2'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
              }`}
              style={{ borderLeftColor: activeTab === 'appointments' ? activeColor : undefined }}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Citas</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-surface-light text-text-primary md:border-l-2'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
              }`}
              style={{ borderLeftColor: activeTab === 'stats' ? activeColor : undefined }}
            >
              <TrendingUp className="w-4 h-4 flex-shrink-0" />
              <span>Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-surface-light text-text-primary md:border-l-2'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
              }`}
              style={{ borderLeftColor: activeTab === 'services' ? activeColor : undefined }}
            >
              <Scissors className="w-4 h-4 flex-shrink-0" />
              <span>Servicios</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'schedule'
                  ? 'bg-surface-light text-text-primary md:border-l-2'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
              }`}
              style={{ borderLeftColor: activeTab === 'schedule' ? activeColor : undefined }}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Horarios</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-surface-light text-text-primary md:border-l-2'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
              }`}
              style={{ borderLeftColor: activeTab === 'profile' ? activeColor : undefined }}
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              <span>Perfil</span>
            </button>

            {barbershop.plan_type === 'equipo' && (
              <button
                onClick={() => setActiveTab('equipo')}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === 'equipo'
                    ? 'bg-surface-light text-text-primary md:border-l-2'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-light/30'
                }`}
                style={{ borderLeftColor: activeTab === 'equipo' ? activeColor : undefined }}
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>Equipo</span>
              </button>
            )}
          </nav>
        </div>

        {/* Footer Sidebar (Desktop Only) */}
        <div className="p-4 border-t border-white/5 hidden md:flex flex-col gap-4">
          <div className="flex items-center gap-3 bg-background/50 p-3 rounded-2xl border border-white/5">
            <div className="w-9 h-9 rounded-full bg-surface-light border border-white/10 flex items-center justify-center font-bold text-xs text-gold">
              {profile.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-sora text-xs font-bold truncate">{profile.full_name}</h4>
              <p className="text-[10px] text-text-secondary capitalize">{profile.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-white/5 hover:border-danger/20 hover:bg-danger/5 text-text-secondary hover:text-danger text-sm font-semibold transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="bg-background p-4 sm:p-6 md:p-10 z-10 relative md:flex-1 md:overflow-y-auto md:min-h-0">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-gold/5 blur-[100px] pointer-events-none -z-10" />

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
          <div>
            <h1 className="font-sora text-2xl md:text-3xl font-extrabold capitalize">
              {activeTab === 'appointments' && 'Gestión de Citas'}
              {activeTab === 'stats'        && 'Estadísticas de Ganancias'}
              {activeTab === 'services'     && 'Catálogo de Servicios'}
              {activeTab === 'schedule'     && 'Horarios e Inactividad'}
              {activeTab === 'profile'      && 'Información de la Barbería'}
              {activeTab === 'equipo'       && 'Mi Equipo'}
            </h1>
            <p className="text-xs md:text-sm text-text-secondary mt-1 font-medium">
              {activeTab === 'appointments' && 'Monitorea, confirma o cancela las reservas de tus clientes.'}
              {activeTab === 'stats'        && 'Ingresos por día, mes y servicio basados en tus citas confirmadas.'}
              {activeTab === 'services'     && 'Crea, edita o desactiva los servicios ofrecidos en tu local.'}
              {activeTab === 'schedule'     && 'Configura tu disponibilidad semanal y bloquea fechas específicas.'}
              {activeTab === 'profile'      && 'Actualiza tus redes de contacto, dirección y personaliza tu marca.'}
              {activeTab === 'equipo'       && `Gestiona los barberos de tu equipo. Máximo ${barbershop.max_barberos} barberos en tu plan.`}
            </p>
          </div>

          {/* Quick links & buttons */}
          <div className="flex gap-3">
            <a 
              href={`/b/${barbershop.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-surface-dark hover:bg-surface-light border border-white/5 text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Globe className="w-4 h-4" />
              Ver Enlace Público
            </a>
            
            {activeTab === 'services' && (
              <button 
                onClick={openCreateServiceModal}
                className="text-background font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg"
                style={{ backgroundColor: activeColor, boxShadow: `0 4px 12px ${activeColor}20` }}
              >
                <Plus className="w-4 h-4 text-background" />
                Agregar Servicio
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Tab Body */}
        {tabLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-gold animate-spin" style={{ color: activeColor }} />
            <span className="text-xs text-text-secondary">Cargando base de datos...</span>
          </div>
        ) : (
          <>
            {/* VIEW 1: Appointments */}
            {activeTab === 'appointments' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(['all', 'confirmada', 'completada', 'cancelada'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setAppointmentFilter(filter)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize border transition-all whitespace-nowrap ${
                        appointmentFilter === filter
                          ? 'bg-surface-light text-text-primary border-gold'
                          : 'bg-surface-dark/40 border-white/5 text-text-secondary hover:border-white/10 hover:bg-surface-light/30'
                      }`}
                      style={{ borderColor: appointmentFilter === filter ? activeColor : undefined }}
                    >
                      {filter === 'all' ? 'Todas' : filter === 'confirmada' ? 'Confirmadas' : filter === 'completada' ? 'Completadas' : 'Canceladas'}
                    </button>
                  ))}
                </div>

                {/* Appointments Table / Cards */}
                {appointments.filter(a => appointmentFilter === 'all' || a.status === appointmentFilter).length === 0 ? (
                  <div className="py-16 text-center text-text-secondary text-sm border border-white/5 rounded-3xl bg-surface-dark/20 glass">
                    <CalendarDays className="w-8 h-8 text-gold mx-auto mb-3 opacity-60" style={{ color: activeColor }} />
                    No hay citas registradas en este estado.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {appointments
                      .filter(a => appointmentFilter === 'all' || a.status === appointmentFilter)
                      .map((appointment) => {
                        const dateFormatted = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });

                        return (
                          <div 
                            key={appointment.id}
                            className="glass border border-white/5 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-white/10 transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shrink-0 hidden sm:flex"
                                style={{ backgroundColor: `${activeColor}08` }}
                              >
                                <Calendar className="w-5 h-5" style={{ color: activeColor }} />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-sora text-sm font-bold">{appointment.client_name}</h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    appointment.status === 'confirmada' && 'bg-gold/10 text-gold border border-gold/20'
                                  } ${
                                    appointment.status === 'completada' && 'bg-success/10 text-success border border-success/20'
                                  } ${
                                    appointment.status === 'cancelada' && 'bg-danger/10 text-danger border border-danger/20'
                                  }`}
                                  style={{ 
                                    backgroundColor: appointment.status === 'confirmada' ? `${activeColor}15` : undefined,
                                    borderColor: appointment.status === 'confirmada' ? `${activeColor}30` : undefined,
                                    color: appointment.status === 'confirmada' ? activeColor : undefined,
                                  }}
                                  >
                                    {appointment.status}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-text-secondary">
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{appointment.start_time.substring(0, 5)} hrs</span>
                                  <span className="flex items-center gap-1 uppercase">{dateFormatted}</span>
                                  <span className="flex items-center gap-1 font-medium"><Scissors className="w-3.5 h-3.5" />{appointment.services?.name || 'Servicio'}</span>
                                  <span className="flex items-center gap-1 font-bold text-text-primary"><DollarSign className="w-3.5 h-3.5" />{appointment.services?.price || '0'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 self-end sm:self-center border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                              {appointment.client_phone && (
                                <a 
                                  href={`tel:${appointment.client_phone}`}
                                  className="p-2 border border-white/5 bg-surface-dark hover:bg-surface-light rounded-lg text-text-secondary hover:text-text-primary transition-all text-xs flex items-center gap-1.5"
                                  title="Llamar Cliente"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span className="sm:hidden">Llamar</span>
                                </a>
                              )}
                              
                              {appointment.status !== 'completada' && appointment.status !== 'cancelada' && (
                                <>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'completada')}
                                    className="p-2 bg-success/10 hover:bg-success/20 border border-success/20 rounded-lg text-success transition-all text-xs flex items-center gap-1.5 font-bold"
                                    title="Completar Cita"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Completar</span>
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelada')}
                                    className="p-2 bg-danger/10 hover:bg-danger/20 border border-danger/20 rounded-lg text-danger transition-all text-xs flex items-center gap-1.5 font-bold"
                                    title="Cancelar Cita"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Cancelar</span>
                                  </button>
                                </>
                              )}

                              {appointment.status === 'cancelada' && (
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmada')}
                                  className="p-2 bg-surface-light hover:bg-white/10 border border-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-all text-xs flex items-center gap-1.5"
                                  title="Re-confirmar Cita"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Reactivar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW: Stats */}
            {activeTab === 'stats' && (() => {
              const today = new Date().toISOString().split('T')[0];
              const thisMonth = today.substring(0, 7);

              const totalRevenue = appointments.reduce((s, a) => s + (a.services?.price || 0), 0);
              const monthRevenue = appointments.filter(a => a.appointment_date.startsWith(thisMonth)).reduce((s, a) => s + (a.services?.price || 0), 0);
              const todayRevenue = appointments.filter(a => a.appointment_date === today).reduce((s, a) => s + (a.services?.price || 0), 0);

              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                const str = d.toISOString().split('T')[0];
                return {
                  date: d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
                  revenue: appointments.filter(a => a.appointment_date === str).reduce((s, a) => s + (a.services?.price || 0), 0)
                };
              });

              const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
                const yr = d.getFullYear(); const mo = d.getMonth();
                const prefix = `${yr}-${String(mo + 1).padStart(2, '0')}`;
                return {
                  month: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
                  revenue: appointments.filter(a => a.appointment_date.startsWith(prefix)).reduce((s, a) => s + (a.services?.price || 0), 0)
                };
              });

              const serviceMap: Record<string, { name: string; revenue: number; count: number }> = {};
              appointments.forEach(a => {
                if (a.services) {
                  if (!serviceMap[a.services.name]) serviceMap[a.services.name] = { name: a.services.name, revenue: 0, count: 0 };
                  serviceMap[a.services.name].revenue += a.services.price;
                  serviceMap[a.services.name].count += 1;
                }
              });
              const revenueByService = Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue);
              const PIE_COLORS = ['#C9A84C', '#4CAF50', '#3B82F6', '#EF4444', '#A855F7', '#F59E0B'];

              return (
                <div className="flex flex-col gap-8 animate-fade-in">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Ingresos Totales', value: totalRevenue, sub: 'todas las citas confirmadas', icon: <DollarSign className="w-5 h-5" style={{ color: activeColor }} /> },
                      { label: 'Este Mes', value: monthRevenue, sub: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), icon: <CalendarDays className="w-5 h-5" style={{ color: activeColor }} /> },
                      { label: 'Hoy', value: todayRevenue, sub: new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }), icon: <TrendingUp className="w-5 h-5" style={{ color: activeColor }} /> },
                    ].map(({ label, value, sub, icon }) => (
                      <div key={label} className="glass border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-text-secondary tracking-wider">{icon}{label}</div>
                        <span className="font-sora text-3xl font-extrabold" style={{ color: activeColor }}>${value.toLocaleString('es-CL')}</span>
                        <span className="text-xs text-text-secondary capitalize">{sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Last 7 days + Services pie */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass border border-white/5 p-6 rounded-3xl">
                      <h3 className="font-sora text-sm font-bold mb-5">Ingresos últimos 7 días</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={last7Days} margin={{ left: -15, bottom: 0 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`$${v}`, 'Ingresos']} />
                          <Bar dataKey="revenue" fill={activeColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="glass border border-white/5 p-6 rounded-3xl">
                      <h3 className="font-sora text-sm font-bold mb-5">Ingresos por servicio</h3>
                      {revenueByService.length === 0 ? (
                        <p className="text-xs text-text-secondary py-8 text-center">Sin datos aún</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={revenueByService} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                              {revenueByService.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`$${v}`, 'Ingresos']} />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Last 6 months */}
                  <div className="glass border border-white/5 p-6 rounded-3xl">
                    <h3 className="font-sora text-sm font-bold mb-5">Ingresos últimos 6 meses</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={last6Months} margin={{ left: -15, bottom: 0 }}>
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11 }} formatter={(v: any) => [`$${v}`, 'Ingresos']} />
                        <Bar dataKey="revenue" fill={activeColor} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}

            {/* VIEW 2: Services */}
            {activeTab === 'services' && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {services.length === 0 ? (
                  <div className="py-16 text-center text-text-secondary text-sm border border-white/5 rounded-3xl bg-surface-dark/20 glass">
                    <Scissors className="w-8 h-8 text-gold mx-auto mb-3 opacity-60" style={{ color: activeColor }} />
                    No hay servicios configurados. Agrega uno arriba.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`glass border p-5 rounded-2xl flex justify-between items-center transition-all ${
                          service.is_active ? 'border-white/5 hover:border-white/10' : 'border-transparent opacity-40 hover:opacity-50'
                        }`}
                      >
                        <div className="flex flex-col gap-1.5">
                          <h3 className="font-sora text-sm font-bold flex items-center gap-2">
                            {service.name}
                            {!service.is_active && (
                              <span className="text-[9px] bg-surface-light px-2 py-0.5 rounded uppercase tracking-wider text-text-secondary font-bold font-inter">
                                Inactivo
                              </span>
                            )}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-text-secondary font-medium">
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-text-secondary" /> {service.duration_min} minutos</span>
                            <span className="flex items-center gap-0.5 font-bold text-gold" style={{ color: activeColor }}><DollarSign className="w-3.5 h-3.5" />{service.price}</span>
                          </div>
                        </div>

                        {/* Service Actions */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditServiceModal(service)}
                            className="p-2 border border-white/5 bg-surface-dark hover:bg-surface-light rounded-lg text-text-secondary hover:text-text-primary transition-all"
                            title="Editar Servicio"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteService(service.id)}
                            className="p-2 border border-white/5 bg-surface-dark hover:bg-danger/10 hover:border-danger/20 hover:text-danger rounded-lg text-text-secondary transition-all"
                            title="Eliminar Servicio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Service Form Modal */}
                {serviceModalOpen && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                      <button 
                        onClick={() => setServiceModalOpen(false)}
                        className="absolute top-4 right-4 p-1 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <h3 className="font-sora text-lg font-bold mb-6">
                        {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                      </h3>

                      <form onSubmit={handleServiceSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="serviceName" className="text-xs text-text-secondary font-medium pl-1">
                            Nombre del Servicio
                          </label>
                          <input
                            required
                            type="text"
                            id="serviceName"
                            value={serviceName}
                            onChange={(e) => setServiceName(e.target.value)}
                            placeholder="Ej: Corte Degradado (Fade)"
                            className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="serviceDuration" className="text-xs text-text-secondary font-medium pl-1">
                              Duración (Minutos)
                            </label>
                            <input
                              required
                              type="number"
                              min="5"
                              max="240"
                              id="serviceDuration"
                              value={serviceDuration}
                              onChange={(e) => setServiceDuration(parseInt(e.target.value, 10))}
                              className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="servicePrice" className="text-xs text-text-secondary font-medium pl-1">
                              Precio ($)
                            </label>
                            <input
                              required
                              type="number"
                              min="0"
                              id="servicePrice"
                              value={servicePrice}
                              onChange={(e) => setServicePrice(parseInt(e.target.value, 10))}
                              className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-1 py-2">
                          <input
                            type="checkbox"
                            id="serviceIsActive"
                            checked={serviceIsActive}
                            onChange={(e) => setServiceIsActive(e.target.checked)}
                            className="w-4 h-4 accent-gold rounded focus:ring-0 border-white/10"
                            style={{ accentColor: activeColor }}
                          />
                          <label htmlFor="serviceIsActive" className="text-xs text-text-primary font-medium cursor-pointer">
                            Servicio activo (Mostrar en página de reservas)
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full text-background font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm mt-3"
                          style={{ backgroundColor: activeColor }}
                        >
                          {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: schedules & Blocked Dates */}
            {activeTab === 'schedule' && (
              <div className="grid md:grid-cols-12 gap-8 items-start animate-fade-in">
                {/* schedules Config */}
                <div className="md:col-span-7 glass border border-white/5 p-6 rounded-3xl flex flex-col gap-5">
                  <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5">Disponibilidad Semanal</h3>
                  
                  <div className="flex flex-col gap-5 font-inter">
                    {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][weekday];
                      const schedule = schedules.find(s => s.weekday === weekday);
                      const isWorking = schedule?.is_active || false;
                      const activeSlots: string[] = Array.isArray(schedule?.custom_slots) ? schedule!.custom_slots! : [];

                      return (
                        <div key={weekday} className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-dark/40 border border-white/5">

                          {/* Header row: day name + toggle + presets */}
                          <div className="flex flex-wrap items-center gap-3 justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`day-toggle-${weekday}`}
                                checked={isWorking}
                                onChange={(e) => handleScheduleChange(weekday, 'is_active', e.target.checked)}
                                className="w-4 h-4 rounded focus:ring-0"
                                style={{ accentColor: activeColor }}
                              />
                              <label htmlFor={`day-toggle-${weekday}`} className="text-sm font-bold w-24 cursor-pointer select-none">
                                {dayName}
                              </label>
                              {isWorking && (
                                <span className="text-[10px] text-text-secondary font-medium">
                                  {activeSlots.length} hora{activeSlots.length !== 1 ? 's' : ''} activa{activeSlots.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {isWorking && (
                              <div className="flex gap-1.5 flex-wrap">
                                {(['mañana', 'tarde', 'full'] as const).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => handleSetPreset(weekday, p)}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 text-text-secondary hover:text-text-primary hover:border-white/20 transition-all capitalize"
                                  >
                                    {p === 'full' ? 'Día completo' : p.charAt(0).toUpperCase() + p.slice(1)}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleSetPreset(weekday, 'clear')}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-danger/20 text-danger/60 hover:text-danger hover:border-danger/40 transition-all"
                                >
                                  Limpiar
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Slot grid */}
                          {isWorking && (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-1">
                              {ALL_TIME_SLOTS.map(slot => {
                                const on = activeSlots.includes(slot);
                                return (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => handleSlotToggle(weekday, slot)}
                                    className={`text-[11px] font-semibold py-1.5 rounded-lg transition-all select-none ${
                                      on
                                        ? 'text-background font-bold shadow-sm'
                                        : 'bg-surface-dark border border-white/5 text-text-secondary hover:border-white/20 hover:text-text-primary'
                                    }`}
                                    style={on ? { backgroundColor: activeColor } : undefined}
                                  >
                                    {slot}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {!isWorking && (
                            <p className="text-xs text-text-secondary/50 pl-7">Día sin atención — activa el toggle para configurar horarios</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blocked Dates Config */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  {/* Add Block Form */}
                  <div className="glass border border-white/5 p-6 rounded-3xl">
                    <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5 mb-4">Bloquear Fecha Única</h3>
                    
                    <form onSubmit={handleAddBlockedDate} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="blockedDate" className="text-xs text-text-secondary font-medium">
                          Fecha a Bloquear
                        </label>
                        <input
                          required
                          type="date"
                          id="blockedDate"
                          value={blockedDateStr}
                          onChange={(e) => setBlockedDateStr(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-semibold"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="blockedReason" className="text-xs text-text-secondary font-medium">
                          Motivo / Razón
                        </label>
                        <input
                          type="text"
                          id="blockedReason"
                          value={blockedDateReason}
                          onChange={(e) => setBlockedDateReason(e.target.value)}
                          placeholder="Ej: Feriado / Vacaciones / Trámite"
                          className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full text-background font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                        style={{ backgroundColor: activeColor }}
                      >
                        Bloquear Fecha
                      </button>
                    </form>
                  </div>

                  {/* List Blocked Dates */}
                  <div className="glass border border-white/5 p-6 rounded-3xl">
                    <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5 mb-4">Fechas Bloqueadas Activas</h3>
                    
                    {blockedDates.length === 0 ? (
                      <p className="text-xs text-text-secondary leading-relaxed font-inter">No tienes fechas inhabilitadas actualmente.</p>
                    ) : (
                      <div className="flex flex-col gap-3 font-inter max-h-60 overflow-y-auto">
                        {blockedDates.map((bd) => {
                          const dateObj = new Date(bd.blocked_date + 'T00:00:00');
                          return (
                            <div 
                              key={bd.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-surface-dark/40 border border-white/5 text-xs text-text-primary"
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold uppercase tracking-wider text-[10px]">
                                  {dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                </span>
                                {bd.reason && <span className="text-text-secondary text-[10px] truncate max-w-[150px]">{bd.reason}</span>}
                              </div>
                              <button
                                onClick={() => handleRemoveBlockedDate(bd.id)}
                                className="p-1.5 bg-danger/10 hover:bg-danger/20 hover:text-danger rounded text-text-secondary transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: My Profile */}
            {activeTab === 'equipo' && (
              <div className="max-w-2xl">
                {/* Capacity bar */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-5 mb-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {teamBarbers.length} / {barbershop.max_barberos} barberos activos
                    </p>
                    <div className="w-full h-1.5 bg-surface-light rounded-full mt-2">
                      <div
                        className="h-1.5 rounded-full bg-gold transition-all"
                        style={{ width: `${Math.min(100, (teamBarbers.length / barbershop.max_barberos) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {teamBarbers.length < barbershop.max_barberos && (
                    <button
                      onClick={() => setShowAddBarberForm(v => !v)}
                      className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold px-4 py-2 rounded-xl transition-all flex-shrink-0"
                    >
                      <UserPlus className="w-4 h-4" />
                      Agregar
                    </button>
                  )}
                </div>

                {/* Add barber form */}
                {showAddBarberForm && (
                  <form
                    onSubmit={handleAddBarber}
                    className="bg-surface-dark border border-gold/20 rounded-2xl p-6 mb-6 flex flex-col gap-4"
                  >
                    <h3 className="font-sora font-bold text-sm text-text-primary">Nuevo barbero</h3>
                    {addBarberError && (
                      <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{addBarberError}</p>
                    )}
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nombre completo"
                        value={newBarberName}
                        onChange={e => setNewBarberName(e.target.value)}
                        required
                        className="bg-surface-light border border-white/10 focus:border-gold/40 rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-colors"
                      />
                      <input
                        type="email"
                        placeholder="Correo"
                        value={newBarberEmail}
                        onChange={e => setNewBarberEmail(e.target.value)}
                        required
                        className="bg-surface-light border border-white/10 focus:border-gold/40 rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-colors"
                      />
                      <input
                        type="password"
                        placeholder="Contraseña temporal"
                        value={newBarberPassword}
                        onChange={e => setNewBarberPassword(e.target.value)}
                        required
                        minLength={8}
                        className="bg-surface-light border border-white/10 focus:border-gold/40 rounded-xl px-4 py-3 text-sm text-text-primary outline-none transition-colors"
                      />
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowAddBarberForm(false); setAddBarberError(''); }}
                        className="text-xs text-text-secondary hover:text-text-primary px-4 py-2 rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={addBarberLoading}
                        className="flex items-center gap-2 bg-gold hover:bg-gold/80 text-black text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                      >
                        {addBarberLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                        Crear barbero
                      </button>
                    </div>
                  </form>
                )}

                {/* Barbers list */}
                {teamBarbers.length === 0 ? (
                  <div className="bg-surface-dark border border-white/5 rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                    <Users className="w-10 h-10 text-text-secondary/30" />
                    <p className="text-text-secondary text-sm">Aún no hay barberos en tu equipo.</p>
                    <button
                      onClick={() => setShowAddBarberForm(true)}
                      className="text-gold text-xs hover:underline"
                    >
                      Agrega el primero →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {teamBarbers.map(barber => (
                      <div
                        key={barber.id}
                        className="bg-surface-dark border border-white/5 rounded-xl px-5 py-4 flex items-center gap-4"
                      >
                        <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-gold text-xs font-bold">{barber.full_name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{barber.full_name}</p>
                          <p className="text-xs text-text-secondary capitalize">{barber.role}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveBarber(barber.id, barber.full_name)}
                          className="p-2 rounded-xl text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Eliminar barbero"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="grid md:grid-cols-12 gap-8 items-start animate-fade-in font-inter">
                {/* Profile Form */}
                <div className="md:col-span-7 glass border border-white/5 p-6 sm:p-8 rounded-3xl">
                  <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5 mb-6">Información General</h3>
                  
                  <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="shopName" className="text-xs text-text-secondary font-medium pl-1">
                        Nombre de la Barbería
                      </label>
                      <input
                        required
                        type="text"
                        id="shopName"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-semibold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="shopPhone" className="text-xs text-text-secondary font-medium pl-1">
                        Teléfono WhatsApp de Contacto
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="tel"
                          id="shopPhone"
                          value={shopPhone}
                          onChange={(e) => setShopPhone(e.target.value)}
                          placeholder="+56912345678"
                          className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="shopAddress" className="text-xs text-text-secondary font-medium pl-1">
                        Dirección Física
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                        <input
                          type="text"
                          id="shopAddress"
                          value={shopAddress}
                          onChange={(e) => setShopAddress(e.target.value)}
                          placeholder="Calle Ejemplo 123, Ciudad"
                          className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-gold transition-colors font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="shopColor" className="text-xs text-text-secondary font-medium pl-1">
                        Color de Marca Principal
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          id="shopColor"
                          value={shopBrandColor}
                          onChange={(e) => setShopBrandColor(e.target.value)}
                          className="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer overflow-hidden p-0"
                        />
                        <span className="font-mono text-sm text-text-secondary uppercase">{shopBrandColor}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full text-background font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 mt-2"
                      style={{ backgroundColor: activeColor }}
                    >
                      {profileSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-background" />
                          Guardando perfil...
                        </>
                      ) : (
                        'Guardar Cambios'
                      )}
                    </button>
                  </form>
                </div>

                {/* Logo and Booking URL panel */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  {/* Share Link card */}
                  <div className="glass border border-white/5 p-6 rounded-3xl">
                    <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5 mb-4">Tu Enlace de Reserva</h3>
                    
                    <p className="text-xs text-text-secondary leading-relaxed font-inter mb-4">
                      Comparte este enlace en tus redes sociales (Instagram, WhatsApp, TikTok) para que tus clientes puedan reservar directamente.
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <div className="bg-surface-dark border border-white/5 rounded-xl px-4 py-3 font-mono text-xs text-gold truncate" style={{ color: activeColor }}>
                        {publicLink}
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(publicLink);
                          alert('¡Enlace de agendamiento copiado al portapapeles!');
                        }}
                        className="w-full bg-surface-light hover:bg-white/10 border border-white/5 font-semibold py-2.5 rounded-xl transition-all text-xs font-sora"
                      >
                        Copiar Enlace
                      </button>
                    </div>
                  </div>

                  {/* Logo Card Upload */}
                  <div className="glass border border-white/5 p-6 rounded-3xl flex flex-col items-center">
                    <h3 className="font-sora text-base font-bold pb-2 border-b border-white/5 mb-6 w-full text-left">Logo de la Barbería</h3>
                    
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/10 bg-surface-dark mb-6 flex items-center justify-center">
                      {barbershop.logo_url ? (
                        <Image 
                          src={barbershop.logo_url} 
                          alt="Logo de la barbería" 
                          fill 
                          className="object-cover animate-fade-in"
                        />
                      ) : (
                        <Scissors className="w-10 h-10 text-white/20 rotate-90" />
                      )}

                      {logoUploading && (
                        <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-gold animate-spin" style={{ color: activeColor }} />
                        </div>
                      )}
                    </div>

                    <label className="w-full">
                      <span className="w-full flex items-center justify-center gap-2 bg-surface-light border border-white/5 hover:border-gold/30 hover:bg-white/10 font-semibold py-3 px-4 rounded-xl transition-all text-xs font-sora cursor-pointer">
                        <Upload className="w-4 h-4 text-text-secondary" />
                        {barbershop.logo_url ? 'Cambiar Logo' : 'Subir Logo'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-text-secondary mt-3.5 text-center leading-normal max-w-[200px]">
                      Formatos recomendados: PNG, JPG, WEBP. Límite de tamaño: 2MB.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
