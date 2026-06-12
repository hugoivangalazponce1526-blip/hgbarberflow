/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Scissors,
  Plus,
  X,
  Globe,
  User,
  Mail,
  Lock,
  Loader2,
  Activity,
  Layers,
  ShieldAlert,
  LogOut,
  Building,
  UserCheck,
  Trash2,
  TrendingUp,
  DollarSign,
  Users
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface Barbershop {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string | null;
  phone: string | null;
  address: string | null;
  owner_id: string | null;
  plan: 'basic' | 'premium';
  plan_type: 'individual' | 'equipo';
  max_barberos: number;
  is_active: boolean;
  created_at: string;
  profiles?: Profile[];
}

interface Profile {
  id: string;
  barbershop_id: string;
  full_name: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth States
  const [authLoading, setAuthLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);

  // Data States
  const [shops, setShops] = useState<Barbershop[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [shopPlan, setShopPlan] = useState<'basic' | 'premium'>('basic');
  const [shopPlanType, setShopPlanType] = useState<'individual' | 'equipo'>('individual');
  const [shopMaxBarberos, setShopMaxBarberos] = useState(4);

  // Verify Session and Role
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
          throw new Error('No se pudo verificar tu cuenta de administrador.');
        }

        if (userProfile.role !== 'super_admin') {
          // Redirect to appropriate page
          if (userProfile.role === 'barber') {
            router.replace('/dashboard');
          } else {
            router.replace('/login');
          }
          return;
        }

        setAdminProfile(userProfile);
        loadShops();

      } catch (err: any) {
        console.error('Super Admin auth error:', err);
        alert(err.message || 'Error de autenticación');
        supabase.auth.signOut().then(() => router.replace('/login'));
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, [supabase, router]);

  // Fetch all shops and owner profiles
  const loadShops = async () => {
    try {
      setLoadingShops(true);
      
      // Select barbershops with their associated owner profile
      const { data, error } = await supabase
        .from('barbershops')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShops(data || []);

    } catch (err: any) {
      console.error('Error fetching shops:', err);
      alert('Error al cargar la lista de barberías');
    } finally {
      setLoadingShops(false);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch('/api/admin/create-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopName,
          email: ownerEmail,
          password: ownerPassword,
          owner_name: ownerName,
          plan: shopPlan,
          plan_type: shopPlanType,
          max_barberos: shopPlanType === 'equipo' ? shopMaxBarberos : 1,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error al registrar la barbería.');
      }

      // Success cleanup
      setIsModalOpen(false);
      setShopName('');
      setOwnerName('');
      setOwnerEmail('');
      setOwnerPassword('');
      setShopPlan('basic');
      setShopPlanType('individual');
      setShopMaxBarberos(4);
      
      alert('¡Barbería y barbero creados con éxito!');
      loadShops();

    } catch (err: any) {
      setFormError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!window.confirm(`¿Eliminar permanentemente "${shopName}" y todos sus datos? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch('/api/admin/delete-shop', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      loadShops();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la barbería');
    }
  };

  const toggleShopActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadShops(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Error al modificar estado de la barbería');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center gap-4 font-inter">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="font-sora text-sm text-text-secondary">Cargando panel de control corporativo...</p>
      </div>
    );
  }

  if (!adminProfile) return null;

  // Calculate Metrics
  const totalShops = shops.length;
  const activeShops = shops.filter(s => s.is_active).length;
  const basicPlanShops = shops.filter(s => s.plan === 'basic' && s.plan_type === 'individual').length;
  const premiumPlanShops = shops.filter(s => s.plan === 'premium').length;
  const equipoPlanShops = shops.filter(s => s.plan_type === 'equipo').length;

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-gold selection:text-background font-inter pb-16 overflow-x-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[300px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-gold/5 blur-[120px] opacity-20" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
              <Scissors className="w-5 h-5 text-gold rotate-90" />
            </div>
            <div>
              <span className="font-sora text-base font-bold tracking-tight">
                Barber<span className="text-gold">Flow</span> Admin
              </span>
              <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest">
                Consola de Super Administración
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-surface-dark px-3 py-1.5 rounded-xl border border-white/5 text-xs text-text-secondary font-medium">
              <UserCheck className="w-3.5 h-3.5 text-gold" />
              <span>Super Admin: <span className="font-bold text-text-primary">{adminProfile.full_name}</span></span>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-white/5 hover:border-danger/20 hover:bg-danger/5 text-text-secondary hover:text-danger text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10">
        
        {/* Title row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-sora text-2xl md:text-3xl font-extrabold">Control de Barberías</h1>
            <p className="text-xs md:text-sm text-text-secondary mt-1 font-medium">
              Crea nuevos clientes, gestiona planes y habilita o suspende el servicio de las tiendas.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gold hover:bg-gold-hover text-background font-bold px-5 py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20"
          >
            <Plus className="w-4 h-4 text-background" />
            Agregar Barbería
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          <div className="glass border border-white/5 p-5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Total Barberías</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-sora text-3xl font-bold">{totalShops}</span>
              <div className="p-2.5 rounded-lg bg-surface-dark border border-white/5">
                <Building className="w-4 h-4 text-gold" />
              </div>
            </div>
          </div>

          <div className="glass border border-white/5 p-5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Tiendas Activas</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-sora text-3xl font-bold text-success">{activeShops}</span>
              <div className="p-2.5 rounded-lg bg-success/10 border border-success/20">
                <Activity className="w-4 h-4 text-success" />
              </div>
            </div>
          </div>

          <div className="glass border border-white/5 p-5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Individual</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-sora text-3xl font-bold">{basicPlanShops + premiumPlanShops}</span>
              <div className="p-2.5 rounded-lg bg-surface-dark border border-white/5">
                <Layers className="w-4 h-4 text-text-secondary" />
              </div>
            </div>
          </div>

          <div className="glass border border-white/5 p-5 rounded-2xl flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Full Equipo</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-sora text-3xl font-bold text-gold">{equipoPlanShops}</span>
              <div className="p-2.5 rounded-lg bg-gold/10 border border-gold/20">
                <Users className="w-4 h-4 text-gold" />
              </div>
            </div>
          </div>

        </div>

        {/* Revenue Chart */}
        {(() => {
          const basicCount   = shops.filter(s => s.plan === 'basic' && s.plan_type === 'individual').length;
          const premiumCount = shops.filter(s => s.plan === 'premium').length;
          const equipoCount  = equipoPlanShops;
          const mrr = basicCount * 12 + premiumCount * 10 + equipoCount * 40;
          const arr = mrr * 12;
          const chartData = [
            { plan: 'Mensual', mrr: basicCount * 12, fill: '#C9A84C' },
            { plan: 'Anual', mrr: premiumCount * 10, fill: '#4CAF50' },
            { plan: 'Equipo', mrr: equipoCount * 40, fill: '#8B5CF6' },
          ];
          return (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* KPI cards */}
              <div className="glass border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-gold" /> MRR Estimado
                </span>
                <span className="font-sora text-3xl font-extrabold text-gold">${mrr.toLocaleString()}</span>
                <span className="text-xs text-text-secondary">ARR estimado: <span className="font-bold text-text-primary">${arr.toLocaleString()}</span></span>
              </div>
              <div className="glass border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gold" /> Planes activos
                </span>
                <div className="flex gap-6 mt-1">
                  <div>
                    <span className="font-sora text-2xl font-extrabold">{basicCount}</span>
                    <p className="text-xs text-text-secondary">Mensual</p>
                  </div>
                  <div>
                    <span className="font-sora text-2xl font-extrabold text-gold">{premiumCount}</span>
                    <p className="text-xs text-text-secondary">Anual</p>
                  </div>
                </div>
              </div>
              {/* Bar chart */}
              <div className="glass border border-white/5 p-6 rounded-2xl flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Ingresos por plan (MRR)</span>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="plan" tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: any) => [`$${v}`, 'MRR']}
                    />
                    <Bar dataKey="mrr" radius={[4,4,0,0]}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Shops Table */}
        <div className="glass border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          {loadingShops ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <span className="text-xs text-text-secondary">Consultando catálogo corporativo...</span>
            </div>
          ) : shops.length === 0 ? (
            <div className="py-20 text-center text-text-secondary text-sm">
              <Building className="w-8 h-8 text-gold mx-auto mb-3 opacity-60" />
              No hay barberías registradas en el sistema. Agrega una presionando el botón superior.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-dark/40 font-sora text-xs uppercase font-bold text-text-secondary tracking-wider">
                    <th className="p-5">Barbería</th>
                    <th className="p-5">Enlace Público</th>
                    <th className="p-5">Administrador</th>
                    <th className="p-5">Plan</th>
                    <th className="p-5">Estado</th>
                    <th className="p-5">Fecha Alta</th>
                    <th className="p-5 text-right">Acciones</th>
                    <th className="p-5 text-right">Eliminar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-inter font-medium">
                  {shops.map((shop) => {
                    const owner = shop.profiles?.find(p => p.role === 'barber');
                    const dateFormatted = new Date(shop.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });

                    return (
                      <tr key={shop.id} className="hover:bg-surface-dark/20 transition-all">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-surface-light border border-white/10 flex items-center justify-center font-bold text-xs text-gold">
                              {shop.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-text-primary">{shop.name}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <a 
                            href={`/b/${shop.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-text-secondary hover:text-gold transition-colors flex items-center gap-1.5 text-xs font-mono"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            /b/{shop.slug}
                          </a>
                        </td>
                        <td className="p-5 text-text-secondary">
                          {owner ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-text-primary text-xs">{owner.full_name}</span>
                            </div>
                          ) : (
                            <span className="italic text-xs text-text-secondary/50">Sin dueño asignado</span>
                          )}
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-fit ${
                              shop.plan === 'premium'
                                ? 'bg-gold/10 text-gold border border-gold/20'
                                : 'bg-surface-light text-text-secondary border border-white/5'
                            }`}>
                              {shop.plan === 'premium' ? 'Anual' : 'Mensual'}
                            </span>
                            {shop.plan_type === 'equipo' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-fit bg-gold/5 text-gold/70 border border-gold/10">
                                Equipo ×{shop.max_barberos}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            shop.is_active 
                              ? 'bg-success/10 text-success border border-success/20' 
                              : 'bg-danger/10 text-danger border border-danger/20'
                          }`}>
                            {shop.is_active ? 'Activa' : 'Suspendida'}
                          </span>
                        </td>
                        <td className="p-5 text-text-secondary text-xs">{dateFormatted}</td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => toggleShopActive(shop.id, shop.is_active)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              shop.is_active
                                ? 'bg-danger/10 hover:bg-danger/20 border-danger/20 text-danger'
                                : 'bg-success/10 hover:bg-success/20 border-success/20 text-success'
                            }`}
                          >
                            {shop.is_active ? 'Suspender' : 'Activar'}
                          </button>
                        </td>
                        <td className="p-5 text-right">
                          <button
                            onClick={() => handleDeleteShop(shop.id, shop.name)}
                            className="p-2 rounded-lg border border-danger/20 bg-danger/5 hover:bg-danger/15 text-danger/60 hover:text-danger transition-all"
                            title="Eliminar barbería y usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add Barbershop */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full glass border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <Building className="w-5 h-5 text-gold" />
                <h3 className="font-sora text-lg font-bold">Nueva Barbería</h3>
              </div>

              {formError && (
                <div className="bg-danger/10 border border-danger/20 text-danger text-xs font-semibold p-4 rounded-xl flex gap-2 items-start mb-5 animate-fade-in">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateShop} className="flex flex-col gap-4.5">
                
                {/* Shop Name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="modalShopName" className="text-xs text-text-secondary font-semibold pl-1">
                    Nombre del Establecimiento
                  </label>
                  <input
                    required
                    disabled={formLoading}
                    type="text"
                    id="modalShopName"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Ej: Golden Style Barbería"
                    className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
                  />
                </div>

                {/* Owner Name */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="modalOwnerName" className="text-xs text-text-secondary font-semibold pl-1">
                    Nombre del Dueño (Barbero)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      required
                      disabled={formLoading}
                      type="text"
                      id="modalOwnerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="Ej: Marcos Pérez"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Owner Email */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="modalOwnerEmail" className="text-xs text-text-secondary font-semibold pl-1">
                    Email de Ingreso del Dueño
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      required
                      disabled={formLoading}
                      type="email"
                      id="modalOwnerEmail"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="dueño@correo.com"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Owner Password */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="modalOwnerPassword" className="text-xs text-text-secondary font-semibold pl-1">
                    Contraseña Temporal
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      required
                      disabled={formLoading}
                      type="password"
                      id="modalOwnerPassword"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Plan Type Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-secondary font-semibold pl-1">Tipo de Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['individual', 'equipo'] as const).map((pt) => (
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setShopPlanType(pt)}
                        className={`py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all ${
                          shopPlanType === pt
                            ? 'bg-gold/10 border-gold text-gold'
                            : 'bg-surface-dark border-white/5 text-text-secondary hover:border-white/20'
                        }`}
                      >
                        {pt === 'individual' ? 'Individual' : 'Full Equipo'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max barberos (equipo only) */}
                {shopPlanType === 'equipo' && (
                  <div className="flex flex-col gap-1">
                    <label htmlFor="modalMaxBarberos" className="text-xs text-text-secondary font-semibold pl-1">
                      Número máximo de barberos
                    </label>
                    <input
                      type="number"
                      id="modalMaxBarberos"
                      min={2}
                      max={20}
                      value={shopMaxBarberos}
                      onChange={(e) => setShopMaxBarberos(Number(e.target.value))}
                      className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                    />
                  </div>
                )}

                {/* Billing Plan Selector */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="modalShopPlan" className="text-xs text-text-secondary font-semibold pl-1">
                    Facturación
                  </label>
                  <select
                    id="modalShopPlan"
                    value={shopPlan}
                    onChange={(e: any) => setShopPlan(e.target.value)}
                    className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-semibold"
                  >
                    <option value="basic">Mensual ($12/mes)</option>
                    <option value="premium">Anual ($120/año)</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-gold hover:bg-gold-hover text-background font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 mt-3"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-background" />
                      Registrando en Supabase...
                    </>
                  ) : (
                    'Registrar Barbería'
                  )}
                </button>

              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
