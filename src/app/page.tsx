'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Calendar,
  Clock,
  Smartphone,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Star,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Check,
  Users,
  CheckCircle2,
  XCircle,
  Settings,
  BarChart2,
} from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Smartphone className="w-6 h-6 text-gold" />,
      title: 'Página de Reserva Pública',
      description:
        'Tu propio enlace personalizado (ej: barberflow.app/b/tu-barberia) listo para recibir citas las 24/7, sin que tus clientes instalen nada.',
    },
    {
      icon: <Calendar className="w-6 h-6 text-gold" />,
      title: 'Agenda Inteligente',
      description:
        'Los horarios disponibles se calculan solos según la duración del servicio y tus horas de trabajo. Sin errores ni doble booking.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-gold" />,
      title: 'Datos 100% Privados',
      description:
        'Tu información y la de tus clientes está completamente aislada y protegida. Nadie más puede verla ni acceder a ella.',
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-gold" />,
      title: 'Estadísticas y Reportes',
      description:
        'Visualiza tus ingresos, servicios más solicitados y ocupación diaria desde un panel claro. Toma decisiones con datos reales.',
    },
    {
      icon: <Clock className="w-6 h-6 text-gold" />,
      title: 'Control Total de Horarios',
      description:
        'Configura tus días de descanso, bloquea fechas por vacaciones o festivos, y define breaks entre citas con un click.',
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: 'Multi-Barbero (Plan Equipo)',
      description:
        'Gestiona un equipo completo: hasta 4 barberos con su propia agenda, servicios y horarios completamente independientes.',
    },
  ];

  const faqs = [
    {
      question: '¿Mis clientes necesitan descargar una app?',
      answer:
        'No. Tus clientes reservan directamente desde el navegador de su celular, sin descargar ninguna aplicación. Solo comparte el link de tu barbería y listo.',
    },
    {
      question: '¿Funciona bien desde el celular?',
      answer:
        'Sí, BarberFlow está diseñado primero para móvil. Tanto tu panel de control como la página de reservas para tus clientes están optimizados para teléfono.',
    },
    {
      question: '¿Cuánto tarda en configurarse?',
      answer:
        'En menos de 30 minutos tienes tu barbería lista: subes tu foto, agregas tus servicios con precios, configuras tus horarios y compartes tu link. Sin complicaciones.',
    },
    {
      question: '¿Qué pasa con mis citas si cancelo la suscripción?',
      answer:
        'Tienes acceso completo a tus datos mientras tu suscripción esté activa. Si cancelas, tienes un período de gracia para descargar tu historial. No perdemos tu información.',
    },
    {
      question: '¿Puedo integrar pagos en línea?',
      answer:
        'Por ahora BarberFlow gestiona las reservas y el cobro se realiza presencialmente. La integración de pagos online está en nuestro roadmap para próximas versiones.',
    },
    {
      question: '¿Cómo se crea mi página de reserva pública?',
      answer:
        'Al registrarte, configuras tu identificador único (por ejemplo: tu-barberia). Tus clientes ingresan a barberflow.app/b/tu-barberia y reservan en segundos sin registrarse.',
    },
    {
      question: '¿Puedo personalizar mis servicios y duraciones?',
      answer:
        'Por supuesto. Puedes crear tantos servicios como desees (corte, barba, tinte, etc.) con precio y duración específica. El sistema calcula la disponibilidad en tiempo real.',
    },
    {
      question: '¿Hay contratos de permanencia?',
      answer:
        'No. BarberFlow es suscripción mensual o anual. Cancelas cuando quieras, sin penalizaciones ni costos ocultos.',
    },
  ];

  const comparisonRows = [
    { feature: 'Diseñado para barberías', barberflow: true, booksy: true, calendly: false, whatsapp: false },
    { feature: 'Sin comisión por reserva', barberflow: true, booksy: false, calendly: false, whatsapp: true },
    { feature: 'Precio fijo en pesos (CLP)', barberflow: true, booksy: false, calendly: false, whatsapp: true },
    { feature: 'Soporte en español', barberflow: true, booksy: true, calendly: false, whatsapp: true },
    { feature: 'Sin app para el cliente', barberflow: true, booksy: false, calendly: true, whatsapp: false },
    { feature: 'Página de reservas propia', barberflow: true, booksy: true, calendly: true, whatsapp: false },
    { feature: 'Panel de estadísticas', barberflow: true, booksy: true, calendly: false, whatsapp: false },
    { feature: 'Multi-barbero disponible', barberflow: true, booksy: true, calendly: false, whatsapp: false },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-gold selection:text-background overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BarberFlow",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: "https://hgbarberflow.cl",
            description:
              "Software de reservas para barberías en Chile. Sin comisiones por cita, sin apps para tus clientes. Agenda inteligente, estadísticas y gestión multi-barbero.",
            offers: {
              "@type": "Offer",
              price: "12",
              priceCurrency: "USD",
              priceValidUntil: "2025-12-31",
            },
            provider: {
              "@type": "Organization",
              name: "HG GrowthLab",
              url: "https://hg-growthlab.cl",
            },
            keywords:
              "sistema de reservas barbería, software agenda barbería Chile, reservas online barbería",
          }),
        }}
      />
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gold/5 blur-[80px] sm:blur-[120px]" />
        <div className="absolute top-[20%] right-[5%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-gold/3 blur-[60px] sm:blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Barber Pole icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border overflow-hidden" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)' }}>
              <svg viewBox="0 0 22 32" fill="none" className="w-5 h-8">
                <rect x="1" y="1" width="20" height="30" rx="10" fill="#242424" stroke="rgba(201,168,76,0.3)" strokeWidth="0.5"/>
                {/* Stripes gold */}
                <path d="M1 9 L21 5 L21 9.5 L1 13.5 Z" fill="#C9A84C" opacity="0.95"/>
                <path d="M1 18 L21 13.5 L21 18 L1 22.5 Z" fill="#C9A84C" opacity="0.95"/>
                {/* Stripes white */}
                <path d="M1 4.5 L21 1 L21 5 L1 8.5 Z" fill="white" opacity="0.18"/>
                <path d="M1 13.5 L21 9.5 L21 13.5 L1 17.5 Z" fill="white" opacity="0.18"/>
                <path d="M1 22.5 L21 18 L21 22.5 L1 27 Z" fill="white" opacity="0.18"/>
                {/* Cap top */}
                <ellipse cx="11" cy="1.5" rx="10" ry="2.5" fill="#C9A84C"/>
                {/* Cap bottom */}
                <ellipse cx="11" cy="30.5" rx="10" ry="2.5" fill="#C9A84C"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sora text-xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-gold bg-clip-text text-transparent">
                BarberFlow
              </span>
              <span className="text-[10px] font-medium text-text-secondary tracking-wider">by HG GrowthLab</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Cómo funciona
            </a>
            <a href="#precios" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Precios
            </a>
            <a href="#faq" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-text-primary hover:text-gold text-sm font-medium transition-colors px-4 py-2">
              Iniciar Sesión
            </Link>
            <Link
              href="/login"
              className="bg-gold hover:bg-gold-hover text-background text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20 flex items-center gap-1.5"
            >
              Probar Gratis
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-primary hover:text-gold transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-surface-dark border-b border-white/5 py-6 px-4 flex flex-col gap-5 animate-fade-in shadow-2xl z-50">
            <a href="#caracteristicas" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1">Características</a>
            <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1">Cómo funciona</a>
            <a href="#precios" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1">Precios</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1">FAQ</a>
            <hr className="border-white/5" />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center text-text-primary hover:text-gold text-sm font-medium py-3 border border-white/5 rounded-xl">
                Iniciar Sesión
              </Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-center bg-gold hover:bg-gold-hover text-background text-sm font-semibold py-3.5 rounded-xl shadow-lg">
                Probar Gratis
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid md:grid-cols-12 gap-12 md:gap-8 items-center">
          <div className="md:col-span-7 flex flex-col gap-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-3 py-1.5 self-center md:self-start max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-semibold text-gold tracking-wider uppercase font-sora text-center">
                ⚡ Reservas para barberías · +200 en Chile
              </span>
            </div>

            <h1 className="text-[2rem] sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent">
                El sistema de reservas{' '}
              </span>
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                premium
              </span>
              <span className="bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent">
                {' '}que tu barbería merece.
              </span>
            </h1>

            <div className="flex flex-col gap-2">
              <p className="text-sm sm:text-lg text-text-secondary max-w-xl mx-auto md:mx-0 leading-relaxed font-inter">
                BarberFlow automatiza tus citas, gestiona tu equipo y deleita a tus clientes con una interfaz rápida y elegante.
              </p>
              <p className="text-xs sm:text-sm font-semibold text-gold/80 max-w-xl mx-auto md:mx-0 font-inter">
                Sin comisiones. Sin apps. Solo tu barbería funcionando sola.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center mt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto text-center bg-gold hover:bg-gold-hover text-background font-bold px-8 py-4 rounded-xl shadow-xl shadow-gold/10 hover:shadow-gold/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                Comenzar Hoy Mismo
                <ChevronRight className="w-5 h-5" />
              </Link>
              <a
                href="https://wa.me/56934022106"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center bg-surface-light hover:bg-white/10 text-text-primary border border-white/5 font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Hablar con nosotros 💬
              </a>
            </div>
            <p className="text-xs text-text-secondary font-inter text-center md:text-left -mt-1">
              ✓ 14 días gratis · Sin tarjeta de crédito
            </p>

            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8 mt-2 max-w-md mx-auto md:mx-0">
              <div>
                <div className="font-sora text-2xl font-bold text-gold">99.9%</div>
                <div className="text-xs text-text-secondary">Disponibilidad</div>
              </div>
              <div>
                <div className="font-sora text-2xl font-bold text-gold">+10k</div>
                <div className="text-xs text-text-secondary">Citas Agendadas</div>
              </div>
              <div>
                <div className="font-sora text-2xl font-bold text-gold">&lt;10 seg</div>
                <div className="text-xs text-text-secondary">Tiempo de Reserva</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center items-center">
            <div className="absolute w-[80%] h-[80%] rounded-full bg-gold/10 blur-[60px] -z-10" />
            {/* Dashboard Mockup */}
            <div className="relative w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10" style={{ background: '#161616' }}>
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5" style={{ background: '#1e1e1e' }}>
                <span className="w-2.5 h-2.5 rounded-full bg-danger/60" />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#C9A84C99' }} />
                <span className="w-2.5 h-2.5 rounded-full bg-success/60" />
                <span className="ml-3 flex-1 bg-background/60 rounded text-[9px] text-text-secondary/40 px-2 py-0.5 font-mono">hgbarberflow.cl/dashboard</span>
              </div>
              <div className="flex" style={{ height: 310 }}>
                {/* Sidebar */}
                <div className="w-36 border-r border-white/5 flex flex-col py-3 px-2 gap-0.5 shrink-0" style={{ background: '#1a1a1a' }}>
                  <div className="flex items-center gap-2 px-2 py-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#C9A84C20', border: '1px solid #C9A84C30' }}>
                      <Scissors className="w-3 h-3 rotate-90" style={{ color: '#C9A84C' }} />
                    </div>
                    <span className="text-[10px] font-bold truncate" style={{ color: '#F5F5F5' }}>Barbería Elite</span>
                  </div>
                  {[
                    { label: 'Citas', Icon: Calendar, active: true },
                    { label: 'Stats', Icon: TrendingUp, active: false },
                    { label: 'Servicios', Icon: Scissors, active: false },
                    { label: 'Horarios', Icon: Clock, active: false },
                    { label: 'Perfil', Icon: Settings, active: false },
                  ].map(({ label, Icon, active }) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium"
                      style={{ background: active ? '#C9A84C15' : 'transparent', color: active ? '#C9A84C' : '#6b7280', borderLeft: active ? '2px solid #C9A84C' : '2px solid transparent' }}>
                      <Icon className="w-3 h-3 shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
                {/* Main panel */}
                <div className="flex-1 p-3 overflow-hidden flex flex-col gap-2.5">
                  <p className="text-[11px] font-extrabold font-sora" style={{ color: '#F5F5F5' }}>Gestión de Citas</p>
                  {/* Appointment cards */}
                  {[
                    { name: 'Mateo A.', svc: 'Corte Fade', time: '09:30', st: 'confirmada', c: '#C9A84C' },
                    { name: 'Carlos R.', svc: 'Barba', time: '10:00', st: 'confirmada', c: '#C9A84C' },
                    { name: 'Pedro L.', svc: 'Corte + Barba', time: '11:30', st: 'completada', c: '#22C55E' },
                    { name: 'Diego M.', svc: 'Fade completo', time: '12:00', st: 'confirmada', c: '#C9A84C' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border"
                      style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                          style={{ background: '#C9A84C15', color: '#C9A84C' }}>{a.name.charAt(0)}</div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold truncate" style={{ color: '#F5F5F5' }}>{a.name}</p>
                          <p className="text-[8px]" style={{ color: '#6b7280' }}>{a.svc} · {a.time}</p>
                        </div>
                      </div>
                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `${a.c}15`, color: a.c, border: `1px solid ${a.c}30` }}>{a.st}</span>
                    </div>
                  ))}
                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-1.5 mt-auto">
                    {[{ l: 'Hoy', v: '$45k' }, { l: 'Mes', v: '$890k' }, { l: 'Citas', v: '23' }].map(({ l, v }) => (
                      <div key={l} className="rounded-lg p-2 border text-center" style={{ background: '#1e1e1e', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <p className="text-[8px]" style={{ color: '#6b7280' }}>{l}</p>
                        <p className="text-[10px] font-bold font-sora" style={{ color: '#C9A84C' }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-20 bg-surface-dark/40 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Por qué BarberFlow</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Diseñado exclusivamente para la barbería moderna.
            </p>
            <p className="text-text-secondary text-base sm:text-lg mt-4 font-inter leading-relaxed">
              Todo lo que necesitas para que tus barberos trabajen eficientemente y tus clientes reserven sin fricción.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="bg-surface-dark border border-white/5 p-8 rounded-2xl hover:border-gold/30 hover:bg-surface-light/40 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-light border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-gold/20 transition-all duration-300">
                  {feat.icon}
                </div>
                <h3 className="font-sora text-lg font-bold mb-3 group-hover:text-gold transition-colors">{feat.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed font-inter">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Así de simple</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">Así funciona BarberFlow.</p>
          <p className="text-text-secondary text-base sm:text-lg mt-4 font-inter">
            Configúralo en minutos. Empieza a recibir reservas el mismo día.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">

          {/* ── Paso 1: Configura ── */}
          <div className="flex flex-col gap-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl" style={{ background: '#161616' }}>
              {/* Header chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5" style={{ background: '#1e1e1e' }}>
                <Settings className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                <span className="text-[10px] font-bold font-sora" style={{ color: '#F5F5F5' }}>Catálogo de Servicios</span>
                <div className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#C9A84C15', color: '#C9A84C', border: '1px solid #C9A84C30' }}>+ Agregar</div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[
                  { name: 'Corte Degradado', dur: '45 min', price: '$12.000' },
                  { name: 'Barba Completa', dur: '30 min', price: '$8.000' },
                  { name: 'Corte + Barba', dur: '60 min', price: '$18.000' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl border" style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: '#F5F5F5' }}>{s.name}</p>
                      <p className="text-[9px]" style={{ color: '#6b7280' }}>{s.dur}</p>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: '#C9A84C' }}>{s.price}</span>
                  </div>
                ))}
                {/* Horario semanal */}
                <div className="border-t border-white/5 pt-2.5 mt-0.5">
                  <p className="text-[9px] mb-2" style={{ color: '#6b7280' }}>Disponibilidad semanal</p>
                  <div className="flex gap-1">
                    {[['L',true],['M',true],['X',true],['J',true],['V',true],['S',true],['D',false]].map(([d, on], i) => (
                      <div key={i} className="flex-1 text-center py-1.5 rounded-lg text-[9px] font-bold"
                        style={{ background: on ? '#C9A84C20' : '#2E2E2E', color: on ? '#C9A84C' : '#444', border: `1px solid ${on ? '#C9A84C30' : 'transparent'}` }}>{d}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 w-7 h-7 rounded-full flex items-center justify-center font-sora font-bold text-xs shadow-lg" style={{ background: '#C9A84C', color: '#0A0A0A' }}>1</div>
            </div>
            <div>
              <h3 className="font-sora text-lg font-bold mb-2">Configura tu barbería</h3>
              <p className="text-text-secondary text-sm font-inter leading-relaxed">Ingresa tus servicios, precios, horarios y foto de tu local. En minutos tu barbería está lista para recibir reservas.</p>
            </div>
          </div>

          {/* ── Paso 2: Cliente reserva ── */}
          <div className="flex flex-col gap-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl flex justify-center py-4" style={{ background: '#161616' }}>
              {/* Phone frame */}
              <div className="w-[170px] rounded-[1.8rem] overflow-hidden shadow-2xl border-2" style={{ background: '#0D0D0D', borderColor: 'rgba(255,255,255,0.12)' }}>
                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2" style={{ background: '#0D0D0D' }}>
                  <span className="text-[7px]" style={{ color: 'rgba(255,255,255,0.4)' }}>09:41</span>
                  <div className="flex gap-0.5">
                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />)}
                  </div>
                </div>
                {/* App */}
                <div style={{ background: '#1A1A1A' }}>
                  {/* Shop header */}
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(13,13,13,0.9)' }}>
                    <div className="w-5 h-5 rounded-lg text-[8px] font-bold flex items-center justify-center shrink-0" style={{ background: '#C9A84C20', color: '#C9A84C', border: '1px solid #C9A84C30' }}>B</div>
                    <span className="text-[8px] font-bold" style={{ color: '#F5F5F5' }}>Barbería Elite</span>
                  </div>
                  <div className="p-2 flex flex-col gap-1.5">
                    {/* Selected service */}
                    <div className="p-2 rounded-lg" style={{ background: '#C9A84C12', border: '1px solid #C9A84C35' }}>
                      <p className="text-[7px] font-bold mb-0.5" style={{ color: '#C9A84C' }}>✓ Corte Degradado</p>
                      <p className="text-[7px]" style={{ color: '#6b7280' }}>45 min · $12.000</p>
                    </div>
                    {/* Mini calendar */}
                    <div className="p-2 rounded-lg" style={{ background: '#242424' }}>
                      <p className="text-[7px] mb-1.5" style={{ color: '#6b7280' }}>Selecciona Fecha</p>
                      <div className="grid grid-cols-7 gap-0.5">
                        {[['L',false],['M',false],['X',true],['J',false],['V',false],['S',false],['D',false]].map(([d, sel], i) => (
                          <div key={i} className="text-center py-1 rounded text-[6px] font-bold"
                            style={{ background: sel ? '#C9A84C' : 'transparent', color: sel ? '#0A0A0A' : '#555' }}>{d}</div>
                        ))}
                      </div>
                    </div>
                    {/* Slots */}
                    <div className="grid grid-cols-3 gap-1">
                      {[['09:00',false],['09:30',true],['10:00',false],['10:30',false],['11:00',false],['11:30',false]].map(([t, sel], i) => (
                        <div key={i} className="text-center py-1.5 rounded text-[7px] font-bold"
                          style={{ background: sel ? '#C9A84C20' : '#2E2E2E', color: sel ? '#C9A84C' : '#555', border: `1px solid ${sel ? '#C9A84C35' : 'transparent'}` }}>{t}</div>
                      ))}
                    </div>
                    {/* CTA */}
                    <div className="py-2 rounded-lg text-center text-[8px] font-bold mt-0.5" style={{ background: '#C9A84C', color: '#0A0A0A' }}>
                      Confirmar Reserva →
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 w-7 h-7 rounded-full flex items-center justify-center font-sora font-bold text-xs shadow-lg" style={{ background: '#C9A84C', color: '#0A0A0A' }}>2</div>
            </div>
            <div>
              <h3 className="font-sora text-lg font-bold mb-2">Tus clientes reservan en segundos</h3>
              <p className="text-text-secondary text-sm font-inter leading-relaxed">Comparte tu link y tus clientes eligen servicio, fecha y hora desde su celular, sin registrarse ni descargar nada.</p>
            </div>
          </div>

          {/* ── Paso 3: Gestiona ── */}
          <div className="flex flex-col gap-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/8 shadow-xl" style={{ background: '#161616' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5" style={{ background: '#1e1e1e' }}>
                <BarChart2 className="w-3.5 h-3.5" style={{ color: '#C9A84C' }} />
                <span className="text-[10px] font-bold font-sora" style={{ color: '#F5F5F5' }}>Estadísticas de Ganancias</span>
              </div>
              <div className="p-3 flex flex-col gap-2.5">
                {/* KPI cards */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[{ l: 'Hoy', v: '$45k' }, { l: 'Este mes', v: '$890k' }, { l: 'Total', v: '$3.2M' }].map(({ l, v }) => (
                    <div key={l} className="p-2 rounded-xl border text-center" style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <p className="text-[8px]" style={{ color: '#6b7280' }}>{l}</p>
                      <p className="text-[10px] font-bold font-sora" style={{ color: '#C9A84C' }}>{v}</p>
                    </div>
                  ))}
                </div>
                {/* Bar chart */}
                <div className="p-3 rounded-xl border" style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] mb-2" style={{ color: '#6b7280' }}>Últimos 7 días</p>
                  <div className="flex items-end gap-1.5" style={{ height: 56 }}>
                    {[35,60,48,80,55,95,42].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-sm transition-all"
                        style={{ height: `${h}%`, background: i === 5 ? '#C9A84C' : '#C9A84C35' }} />
                    ))}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {['L','M','X','J','V','S','D'].map((d, i) => (
                      <div key={i} className="flex-1 text-center text-[7px]" style={{ color: i === 5 ? '#C9A84C' : '#555' }}>{d}</div>
                    ))}
                  </div>
                </div>
                {/* Service breakdown */}
                <div className="p-3 rounded-xl border" style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-[9px] mb-2" style={{ color: '#6b7280' }}>Por servicio</p>
                  {[{ name: 'Corte Fade', pct: 70 }, { name: 'Barba', pct: 45 }, { name: 'Combo', pct: 85 }].map(({ name, pct }) => (
                    <div key={name} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[8px] w-16 shrink-0" style={{ color: '#A3A3A3' }}>{name}</span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#2E2E2E' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: '#C9A84C' }} />
                      </div>
                      <span className="text-[8px] shrink-0" style={{ color: '#C9A84C' }}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-3 left-3 w-7 h-7 rounded-full flex items-center justify-center font-sora font-bold text-xs shadow-lg" style={{ background: '#C9A84C', color: '#0A0A0A' }}>3</div>
            </div>
            <div>
              <h3 className="font-sora text-lg font-bold mb-2">Gestiona todo desde tu panel</h3>
              <p className="text-text-secondary text-sm font-inter leading-relaxed">Ve tus citas del día, tus ingresos del mes y las estadísticas de tu negocio en tiempo real desde tu panel.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Precio de Lanzamiento</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">Tarifas transparentes a tu medida.</p>
          <p className="text-text-secondary text-base sm:text-lg mt-4 font-inter">Sin cargos de instalación. Cancela cuando quieras.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {/* Card mensual */}
          <div className="bg-surface-dark border-2 border-gold p-8 rounded-3xl flex flex-col justify-between hover:shadow-2xl hover:shadow-gold/5 transition-all relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gold text-background text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-gold/20 font-sora">
              Solo este mes
            </div>
            <div>
              <span className="text-xs font-bold text-gold uppercase tracking-widest font-sora">Plan Individual · Mensual</span>
              <div className="mt-4 mb-2 flex items-center gap-3">
                <span className="font-sora text-2xl font-semibold text-text-secondary line-through opacity-60">$20/mes</span>
                <span className="bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-gold/30">
                  Precio especial
                </span>
              </div>
              <div className="flex items-baseline mb-2">
                <span className="font-sora text-5xl sm:text-6xl font-extrabold text-text-primary">$12</span>
                <span className="text-text-secondary text-sm ml-2">/mes</span>
              </div>
              <p className="text-gold text-xs font-semibold mb-6">Precio de lanzamiento — solo este mes</p>
              <hr className="border-white/5 my-6" />
              <ul className="flex flex-col gap-4 text-sm font-medium text-text-primary">
                {['1 Barbería / 1 Barbero', 'Página de reservas personalizada', 'Servicios y horarios ilimitados', 'Panel de control completo', 'Soporte por WhatsApp'].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/login"
                className="block w-full text-center bg-gold hover:bg-gold-hover text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold/20 text-sm hover:-translate-y-0.5"
              >
                Comenzar Hoy Mismo
              </Link>
            </div>
          </div>

          {/* Card anual */}
          <div className="bg-surface-dark border border-white/5 p-8 rounded-3xl flex flex-col justify-between hover:border-white/10 transition-all relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-success text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg font-sora">
              Ahorra 2 meses
            </div>
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest font-sora">Plan Individual · Anual</span>
              <div className="mt-4 mb-2 flex items-center gap-3">
                <span className="font-sora text-2xl font-semibold text-text-secondary line-through opacity-60">$240/año</span>
              </div>
              <div className="flex items-baseline mb-2">
                <span className="font-sora text-5xl sm:text-6xl font-extrabold text-text-primary">$120</span>
                <span className="text-text-secondary text-sm ml-2">/año</span>
              </div>
              <p className="text-text-secondary text-xs font-semibold mb-6">Equivale a $10/mes · Facturado anualmente</p>
              <hr className="border-white/5 my-6" />
              <ul className="flex flex-col gap-4 text-sm font-medium text-text-secondary">
                {['Todo lo del plan mensual', '2 meses gratis incluidos', 'Sin preocupaciones de renovación', 'Soporte prioritario por WhatsApp'].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/login"
                className="block w-full text-center bg-surface-light hover:bg-white/10 text-text-primary font-semibold py-3.5 rounded-xl border border-white/5 transition-all text-sm"
              >
                Contratar Plan Anual
              </Link>
            </div>
          </div>

          {/* Card equipo */}
          <div className="bg-surface-dark border-2 border-gold/40 p-8 rounded-3xl flex flex-col justify-between hover:border-gold/60 hover:shadow-2xl hover:shadow-gold/5 transition-all relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-surface-dark border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full font-sora">
              Nuevo
            </div>
            <div>
              <span className="text-xs font-bold text-gold/70 uppercase tracking-widest font-sora">Plan Full Equipo</span>
              <div className="mt-4 mb-2" />
              <div className="flex items-baseline mb-2">
                <span className="font-sora text-5xl sm:text-6xl font-extrabold text-text-primary">$40k</span>
                <span className="text-text-secondary text-sm ml-2">/mes</span>
              </div>
              <p className="text-text-secondary text-xs font-semibold mb-6">Precio en CLP · Hasta 4 barberos incluidos</p>
              <hr className="border-white/5 my-6" />
              <ul className="flex flex-col gap-4 text-sm font-medium text-text-primary">
                {[
                  'Hasta 4 barberos activos',
                  'Cada barbero con su propia agenda',
                  'Horarios y servicios independientes',
                  'Cliente elige barbero al reservar',
                  'Panel unificado para el dueño',
                  'Soporte prioritario',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link
                href="/login"
                className="block w-full text-center bg-gold/10 hover:bg-gold/20 text-gold font-bold py-4 rounded-xl border border-gold/30 transition-all text-sm hover:-translate-y-0.5"
              >
                Comenzar con Equipo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-surface-dark/40 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Compara</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">BarberFlow vs el resto.</p>
            <p className="text-text-secondary text-base mt-4 font-inter">
              Hecho exclusivamente para barberías en Chile. Sin rodeos.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-4 text-text-secondary font-medium font-inter w-[35%]">Característica</th>
                  <th className="px-5 py-4 text-center font-sora font-bold text-gold bg-gold/5 border-x border-gold/10">BarberFlow</th>
                  <th className="px-5 py-4 text-center text-text-secondary font-medium">Booksy</th>
                  <th className="px-5 py-4 text-center text-text-secondary font-medium">Calendly</th>
                  <th className="px-5 py-4 text-center text-text-secondary font-medium">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-background/20' : ''}`}>
                    <td className="px-5 py-3.5 text-text-secondary font-inter">{row.feature}</td>
                    <td className="px-5 py-3.5 text-center bg-gold/5 border-x border-gold/10">
                      {row.barberflow ? (
                        <CheckCircle2 className="w-5 h-5 text-gold mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger/50 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.booksy ? (
                        <CheckCircle2 className="w-4 h-4 text-success/70 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger/30 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.calendly ? (
                        <CheckCircle2 className="w-4 h-4 text-success/70 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger/30 mx-auto" />
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {row.whatsapp ? (
                        <CheckCircle2 className="w-4 h-4 text-success/70 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-danger/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Opiniones Reales</h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Barberos que dejaron de contestar el teléfono.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  'Antes perdía 1 hora al día respondiendo mensajes de WhatsApp para coordinar citas. Ahora mis clientes agendan solos y yo me concentro en cortar. Recuperé tiempo que no sabía que tenía.',
                name: 'Mateo Arias',
                role: 'Dueño · Arias Barbería',
                city: 'Santiago, RM',
                initials: 'MA',
                avatar: '/assets/avatar-mateo.jpg',
              },
              {
                quote:
                  'Cerré el mes con un 30% más de citas porque mis clientes ahora pueden reservar a las 11 de la noche cuando se acuerdan. El panel me muestra exactamente cuánto gané y con qué servicios.',
                name: 'Carlos Rivas',
                role: 'Barbero Independiente',
                city: 'Concepción, Bio-Bío',
                initials: 'CR',
                avatar: '/assets/avatar-carlos.jpg',
              },
              {
                quote:
                  'Tengo 3 barberos en mi local y cada uno gestiona su propia agenda. Los clientes eligen con quién quieren cortarse. Me ahorré contratar una recepcionista y el negocio se ve mucho más profesional.',
                name: 'Javier Salazar',
                role: 'Fundador · Salazar Studio',
                city: 'Viña del Mar, V Región',
                initials: 'JS',
                avatar: '/assets/avatar-javier.jpg',
              },
            ].map((t, idx) => (
              <div key={idx} className="bg-surface-dark border border-white/5 p-8 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6 font-inter italic">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold font-sora text-sm border"
                    style={{
                      background: idx === 0
                        ? 'linear-gradient(135deg,#C9A84C25,#2E2E2E)'
                        : idx === 1
                        ? 'linear-gradient(135deg,#3B82F625,#2E2E2E)'
                        : 'linear-gradient(135deg,#22C55E25,#2E2E2E)',
                      color: idx === 0 ? '#C9A84C' : idx === 1 ? '#60A5FA' : '#4ADE80',
                      borderColor: idx === 0 ? 'rgba(201,168,76,0.3)' : idx === 1 ? 'rgba(96,165,250,0.3)' : 'rgba(74,222,128,0.3)',
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <h4 className="font-sora text-sm font-bold">{t.name}</h4>
                    <p className="text-xs text-text-secondary">{t.role}</p>
                    <p className="text-xs text-text-secondary/60">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">Tienes Preguntas</h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">Preguntas Frecuentes.</p>
        </div>
        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-surface-dark border border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-6 text-left font-sora font-semibold text-sm sm:text-base text-text-primary hover:text-gold transition-colors"
              >
                <span className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gold flex-shrink-0" />
                  {faq.question}
                </span>
                <span className="text-gold font-bold text-lg select-none ml-2">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              <div
                className={`transition-all duration-300 overflow-hidden ${activeFaq === idx ? 'max-h-48 border-t border-white/5' : 'max-h-0'}`}
              >
                <p className="p-6 text-text-secondary text-sm leading-relaxed font-inter bg-background/20">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="relative rounded-3xl overflow-hidden glass border border-white/5 py-12 px-6 sm:p-16 text-center shadow-2xl flex flex-col gap-6 items-center">
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gold/10 blur-[50px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gold/10 blur-[50px] pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center border overflow-hidden mb-2" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)' }}>
            <svg viewBox="0 0 22 32" fill="none" className="w-6 h-9">
              <rect x="1" y="1" width="20" height="30" rx="10" fill="#242424" stroke="rgba(201,168,76,0.3)" strokeWidth="0.5"/>
              <path d="M1 9 L21 5 L21 9.5 L1 13.5 Z" fill="#C9A84C" opacity="0.95"/>
              <path d="M1 18 L21 13.5 L21 18 L1 22.5 Z" fill="#C9A84C" opacity="0.95"/>
              <path d="M1 4.5 L21 1 L21 5 L1 8.5 Z" fill="white" opacity="0.15"/>
              <path d="M1 13.5 L21 9.5 L21 13.5 L1 17.5 Z" fill="white" opacity="0.15"/>
              <path d="M1 22.5 L21 18 L21 22.5 L1 27 Z" fill="white" opacity="0.15"/>
              <ellipse cx="11" cy="1.5" rx="10" ry="2.5" fill="#C9A84C"/>
              <ellipse cx="11" cy="30.5" rx="10" ry="2.5" fill="#C9A84C"/>
            </svg>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sora">
            ¿Listo para llevar tu barbería al siguiente nivel?
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base font-inter">
            Únete a más de 200 barberos en Chile que ya automatizan sus reservas y ganan más tiempo libre.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
            <Link
              href="/login"
              className="bg-gold hover:bg-gold-hover text-background font-bold px-8 py-4 rounded-xl shadow-xl shadow-gold/20 transition-all text-sm hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Comenzar Hoy Mismo
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/56934022106"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-light hover:bg-white/10 text-text-primary border border-white/5 font-semibold px-8 py-4 rounded-xl transition-all text-sm"
            >
              Hablar con nosotros 💬
            </a>
          </div>
          <p className="text-xs text-text-secondary font-inter -mt-1">✓ 14 días gratis · Sin tarjeta de crédito</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border overflow-hidden" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)' }}>
              <svg viewBox="0 0 22 32" fill="none" className="w-4 h-7">
                <rect x="1" y="1" width="20" height="30" rx="10" fill="#242424" stroke="rgba(201,168,76,0.3)" strokeWidth="0.5"/>
                <path d="M1 9 L21 5 L21 9.5 L1 13.5 Z" fill="#C9A84C" opacity="0.95"/>
                <path d="M1 18 L21 13.5 L21 18 L1 22.5 Z" fill="#C9A84C" opacity="0.95"/>
                <path d="M1 13.5 L21 9.5 L21 13.5 L1 17.5 Z" fill="white" opacity="0.15"/>
                <ellipse cx="11" cy="1.5" rx="10" ry="2.5" fill="#C9A84C"/>
                <ellipse cx="11" cy="30.5" rx="10" ry="2.5" fill="#C9A84C"/>
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sora text-base font-bold tracking-tight text-text-primary">BarberFlow</span>
              <span className="text-[9px] font-medium text-text-secondary tracking-wider">by HG GrowthLab</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-text-secondary text-xs font-inter">
              &copy; {new Date().getFullYear()} BarberFlow. Todos los derechos reservados.
            </p>
            <p className="text-text-secondary text-xs font-inter">
              Creado por{' '}
              <a href="https://hg-growthlab.cl" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline transition-colors">
                HG GrowthLab
              </a>
            </p>
          </div>
          <div className="flex gap-6 text-xs text-text-secondary font-inter">
            <Link href="/privacidad" className="hover:text-gold transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gold transition-colors">Términos</Link>
            <Link href="/soporte" className="hover:text-gold transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
