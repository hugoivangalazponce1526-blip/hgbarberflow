'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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
  MessageSquare, 
  HelpCircle,
  Check
} from 'lucide-react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactShop, setContactShop] = useState('');
  const [contactOwner, setContactOwner] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPlan, setContactPlan] = useState<'mensual' | 'anual'>('mensual');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const planLabel = contactPlan === 'mensual' ? 'Individual Mensual — $12/mes' : 'Individual Anual — $120/año';
    const msg = `¡Hola! Me interesa BarberFlow 🚀\n\n*Mis datos:*\n🏪 Barbería: ${contactShop}\n👤 Nombre: ${contactOwner}\n📧 Email: ${contactEmail}\n📦 Plan: ${planLabel}\n\n¡Quiero comenzar hoy mismo!`;
    window.open(`https://wa.me/56934022106?text=${encodeURIComponent(msg)}`, '_blank');
    setShowContactModal(false);
    setContactShop(''); setContactOwner(''); setContactEmail(''); setContactPlan('mensual');
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: <Smartphone className="w-6 h-6 text-gold" />,
      title: "Página de Reserva Pública",
      description: "Tu propio enlace personalizado (ej: barberflow.app/b/tu-barberia) listo para recibir citas las 24/7."
    },
    {
      icon: <Calendar className="w-6 h-6 text-gold" />,
      title: "Generación Inteligente de Slots",
      description: "Los horarios disponibles se calculan automáticamente según la duración del servicio y tus horas de trabajo."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-gold" />,
      title: "Citas Protegidas (RLS)",
      description: "Cada barbería tiene sus datos aislados por seguridad empresarial a nivel de base de datos en Supabase."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-gold" />,
      title: "Estadísticas y Reportes",
      description: "Visualiza tus ingresos, servicios más solicitados y nivel de ocupación diario desde un panel intuitivo."
    },
    {
      icon: <Clock className="w-6 h-6 text-gold" />,
      title: "Gestión de Horarios y Bloqueos",
      description: "Configura tus días de descanso, horarios especiales y bloquea fechas específicas por vacaciones o festivos."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-gold" />,
      title: "Recordatorios de Citas",
      description: "Envía recordatorios de reserva y permite que tus clientes cancelen o reprogramen de forma autónoma."
    }
  ];

  const faqs = [
    {
      question: "¿Cómo se crea mi página de reserva pública?",
      answer: "Al darte de alta en BarberFlow, configuras tu identificador único (slug). Tus clientes podrán ingresar a barberflow.app/b/tu-barberia desde cualquier dispositivo móvil o computadora y reservar en segundos sin registrarse."
    },
    {
      question: "¿Puedo personalizar mis servicios y duraciones?",
      answer: "¡Por supuesto! Puedes crear tantos servicios como desees (corte, barba, tinte, etc.), asignarle un precio y duración específica en minutos. El sistema calculará la disponibilidad en tiempo real."
    },
    {
      question: "¿Qué es el aislamiento multi-tenant?",
      answer: "Es una arquitectura de seguridad informática avanzada. Garantiza que la información de tus citas, clientes y finanzas esté completamente aislada y blindada de otras barberías mediante Row Level Security (RLS) de Supabase."
    },
    {
      question: "¿Hay contratos de permanencia?",
      answer: "No. BarberFlow es un servicio de suscripción mensual o anual. Puedes cancelar tu suscripción en cualquier momento sin penalizaciones ni costos ocultos."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-gold selection:text-background overflow-x-hidden">
      {/* Background decoration gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-gold/5 blur-[80px] sm:blur-[120px]" />
        <div className="absolute top-[20%] right-[5%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-gold/3 blur-[60px] sm:blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
              <Scissors className="w-5 h-5 text-gold rotate-90" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sora text-xl font-bold tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-gold bg-clip-text text-transparent">
                BarberFlow
              </span>
              <span className="text-[10px] font-medium text-text-secondary tracking-wider">
                by HG GrowthLab
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Características
            </a>
            <a href="#precios" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Precios
            </a>
            <a href="#faq" className="text-text-secondary hover:text-gold text-sm font-medium transition-colors">
              Preguntas Frecuentes
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-text-primary hover:text-gold text-sm font-medium transition-colors px-4 py-2"
            >
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

          {/* Mobile menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-2 text-text-primary hover:text-gold transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-surface-dark border-b border-white/5 py-6 px-4 flex flex-col gap-5 animate-fade-in shadow-2xl z-50">
            <a 
              href="#caracteristicas" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1"
            >
              Características
            </a>
            <a 
              href="#precios" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1"
            >
              Precios
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-text-secondary hover:text-gold text-base font-medium px-2 py-1"
            >
              Preguntas Frecuentes
            </a>
            <hr className="border-white/5" />
            <div className="flex flex-col gap-3">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-text-primary hover:text-gold text-sm font-medium py-3 border border-white/5 rounded-xl"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-center bg-gold hover:bg-gold-hover text-background text-sm font-semibold py-3.5 rounded-xl shadow-lg"
              >
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
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 self-center md:self-start">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-xs font-semibold text-gold tracking-wider uppercase font-sora">
                SaaS de Agendamiento Multi-tenant
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-transparent">
              El sistema de reservas <br />
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                premium
              </span> que tu barbería merece.
            </h1>
            
            <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto md:mx-0 leading-relaxed font-inter">
              BarberFlow es la plataforma definitiva para automatizar tus citas, gestionar a tus barberos y deleitar a tus clientes con una interfaz rápida, elegante y sin esperas.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start items-center mt-4">
              <button
                onClick={() => setShowContactModal(true)}
                className="w-full sm:w-auto text-center bg-gold hover:bg-gold-hover text-background font-bold px-8 py-4 rounded-xl shadow-xl shadow-gold/10 hover:shadow-gold/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                Comenzar Hoy Mismo
                <ChevronRight className="w-5 h-5" />
              </button>
              <a
                href="https://wa.me/56934022106"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center bg-surface-light hover:bg-white/10 text-text-primary border border-white/5 font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Solicitar Demo
              </a>
            </div>

            {/* Micro proof points */}
            <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-8 mt-4 max-w-md mx-auto md:mx-0">
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

          {/* Hero Mockup */}
          <div className="md:col-span-5 relative flex justify-center items-center">
            {/* Background Glow */}
            <div className="absolute w-[80%] h-[80%] rounded-full bg-gold/10 blur-[60px] -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/5 glass p-2 max-w-[450px] md:max-w-full">
              <Image 
                src="/images/dashboard-mockup.png" 
                alt="Panel Administrativo BarberFlow"
                width={600} 
                height={600} 
                className="rounded-xl object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-20 bg-surface-dark/40 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">
              Por qué BarberFlow
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Diseñado exclusivamente para la barbería moderna.
            </p>
            <p className="text-text-secondary text-base sm:text-lg mt-4 font-inter leading-relaxed">
              Equipado con todo lo necesario para que tus barberos trabajen eficientemente y tus clientes reserven sin fricción.
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
                <h3 className="font-sora text-lg font-bold mb-3 group-hover:text-gold transition-colors">
                  {feat.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed font-inter">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">
            Precio de Lanzamiento
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Tarifas transparentes a tu medida.
          </p>
          <p className="text-text-secondary text-base sm:text-lg mt-4 font-inter">
            Sin cargos de instalación. Cancela cuando quieras.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Card mensual */}
          <div className="bg-surface-dark border-2 border-gold p-8 sm:p-10 rounded-3xl flex flex-col justify-between hover:shadow-2xl hover:shadow-gold/5 transition-all relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-gold text-background text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-gold/20 font-sora">
              Solo este mes
            </div>
            <div>
              <span className="text-xs font-bold text-gold uppercase tracking-widest font-sora">
                Plan Individual · Mensual
              </span>

              <div className="mt-4 mb-2 flex items-center gap-3">
                <span className="font-sora text-2xl font-semibold text-text-secondary line-through opacity-60">
                  $20/mes
                </span>
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
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>1 Barbería / 1 Barbero</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Página de reservas personalizada</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Servicios y horarios ilimitados</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Panel de control completo</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Soporte por WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/56934022106"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-gold hover:bg-gold-hover text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold/20 text-sm hover:-translate-y-0.5"
              >
                Comenzar Hoy Mismo
              </a>
            </div>
          </div>

          {/* Card anual */}
          <div className="bg-surface-dark border border-white/5 p-8 sm:p-10 rounded-3xl flex flex-col justify-between hover:border-white/10 transition-all relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-success text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg font-sora">
              Ahorra 2 meses
            </div>
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-widest font-sora">
                Plan Individual · Anual
              </span>

              <div className="mt-4 mb-2 flex items-center gap-3">
                <span className="font-sora text-2xl font-semibold text-text-secondary line-through opacity-60">
                  $240/año
                </span>
              </div>
              <div className="flex items-baseline mb-2">
                <span className="font-sora text-5xl sm:text-6xl font-extrabold text-text-primary">$120</span>
                <span className="text-text-secondary text-sm ml-2">/año</span>
              </div>
              <p className="text-text-secondary text-xs font-semibold mb-6">Equivale a $10/mes · Facturado anualmente</p>

              <hr className="border-white/5 my-6" />

              <ul className="flex flex-col gap-4 text-sm font-medium text-text-secondary">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Todo lo del plan mensual</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>2 meses gratis incluidos</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Sin preocupaciones de renovación</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>Soporte prioritario por WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="https://wa.me/56934022106"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-surface-light hover:bg-white/10 text-text-primary font-semibold py-3.5 rounded-xl border border-white/5 transition-all text-sm"
              >
                Contratar Plan Anual
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface-dark/40 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">
              Opiniones de Barberos
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Aprobado por los mejores profesionales del rubro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface-dark border border-white/5 p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 font-inter italic">
                &ldquo;Desde que uso BarberFlow, mis clientes ya no me llaman por WhatsApp a las 11 de la noche. Entran al enlace de mi barbería, ven a qué hora tengo libre y agendan ellos mismos. Es una maravilla.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-light border border-white/10 flex items-center justify-center font-bold font-sora text-sm text-gold">
                  MA
                </div>
                <div>
                  <h4 className="font-sora text-sm font-bold">Mateo Arias</h4>
                  <p className="text-xs text-text-secondary">Dueño de Arias Barbería</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark border border-white/5 p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 font-inter italic">
                &ldquo;El panel de control me permite ver cuánto gané en la semana con exactitud. Además, mis clientes adoran que la web sea tan rápida y limpia. Definitivamente subió el nivel de mi negocio.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-light border border-white/10 flex items-center justify-center font-bold font-sora text-sm text-gold">
                  CR
                </div>
                <div>
                  <h4 className="font-sora text-sm font-bold">Carlos Rivas</h4>
                  <p className="text-xs text-text-secondary">Barbero Profesional Independiente</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-dark border border-white/5 p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 font-inter italic">
                &ldquo;La seguridad multi-tenant de RLS me daba dudas al principio, pero revisé la arquitectura y el aislamiento de datos es increíble. Puedo tener toda la tranquilidad sobre mi información financiera.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-light border border-white/10 flex items-center justify-center font-bold font-sora text-sm text-gold">
                  JS
                </div>
                <div>
                  <h4 className="font-sora text-sm font-bold">Javier Salazar</h4>
                  <p className="text-xs text-text-secondary">Fundador de Salazar Studio</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold text-gold tracking-widest uppercase font-sora mb-3">
            Tienes Preguntas
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Preguntas Frecuentes.
          </p>
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
                <span className="text-gold font-bold text-lg select-none ml-2">
                  {activeFaq === idx ? '−' : '+'}
                </span>
              </button>
              
              <div 
                className={`transition-all duration-300 overflow-hidden ${activeFaq === idx ? 'max-h-48 border-t border-white/5' : 'max-h-0'}`}
              >
                <p className="p-6 text-text-secondary text-sm leading-relaxed font-inter bg-background/20">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">
        <div className="relative rounded-3xl overflow-hidden glass border border-white/5 py-12 px-6 sm:p-16 text-center shadow-2xl flex flex-col gap-6 items-center">
          {/* background gradient circle */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gold/10 blur-[50px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-gold/10 blur-[50px] pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-2">
            <Scissors className="w-6 h-6 text-gold rotate-90" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sora">
            ¿Listo para llevar tu barbería al siguiente nivel?
          </h2>
          
          <p className="text-text-secondary max-w-xl mx-auto text-sm sm:text-base font-inter">
            Únete a cientos de barberos que ya están automatizando sus reservas y ganando más tiempo libre hoy mismo. Pruébalo gratis por 14 días sin ingresar tarjeta de crédito.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-gold hover:bg-gold-hover text-background font-bold px-8 py-4 rounded-xl shadow-xl shadow-gold/20 transition-all text-sm hover:-translate-y-0.5"
            >
              Comenzar Hoy Mismo
            </button>
            <a
              href="https://wa.me/56934022106"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-light hover:bg-white/10 text-text-primary border border-white/5 font-semibold px-8 py-4 rounded-xl transition-all text-sm"
            >
              Solicitar Demo
            </a>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowContactModal(false)}>
          <div className="max-w-md w-full glass border border-white/10 rounded-3xl p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowContactModal(false)} className="absolute top-4 right-4 p-1.5 text-text-secondary hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-gold rotate-90" />
              </div>
              <div>
                <h3 className="font-sora text-lg font-bold">Cuéntanos de tu barbería</h3>
                <p className="text-xs text-text-secondary">Te contactamos en menos de 24 horas</p>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary pl-1">Nombre de la barbería</label>
                <input
                  required
                  type="text"
                  value={contactShop}
                  onChange={e => setContactShop(e.target.value)}
                  placeholder="Ej: Golden Cuts Barbería"
                  className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary pl-1">Tu nombre (dueño / barbero)</label>
                <input
                  required
                  type="text"
                  value={contactOwner}
                  onChange={e => setContactOwner(e.target.value)}
                  placeholder="Ej: Carlos Pérez"
                  className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary pl-1">Email de contacto</label>
                <input
                  required
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-surface-dark border border-white/5 text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-gold transition-colors font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary pl-1">Plan de interés</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContactPlan('mensual')}
                    className={`flex flex-col items-center py-3 rounded-xl border text-sm font-semibold transition-all ${contactPlan === 'mensual' ? 'bg-gold/10 border-gold text-gold' : 'bg-surface-dark border-white/5 text-text-secondary hover:border-white/20'}`}
                  >
                    <span>Mensual</span>
                    <span className="text-xs font-bold mt-0.5">$12/mes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactPlan('anual')}
                    className={`flex flex-col items-center py-3 rounded-xl border text-sm font-semibold transition-all ${contactPlan === 'anual' ? 'bg-gold/10 border-gold text-gold' : 'bg-surface-dark border-white/5 text-text-secondary hover:border-white/20'}`}
                  >
                    <span>Anual</span>
                    <span className="text-xs font-bold mt-0.5">$120/año</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-gold-hover text-background font-bold py-4 rounded-xl transition-all shadow-lg shadow-gold/20 text-sm mt-2 flex items-center justify-center gap-2"
              >
                Enviar por WhatsApp
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
              <Scissors className="w-4 h-4 text-gold rotate-90" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-sora text-base font-bold tracking-tight text-text-primary">
                BarberFlow
              </span>
              <span className="text-[9px] font-medium text-text-secondary tracking-wider">
                by HG GrowthLab
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-text-secondary text-xs font-inter">
              &copy; {new Date().getFullYear()} BarberFlow. Todos los derechos reservados.
            </p>
            <p className="text-text-secondary text-xs font-inter">
              Creado por{' '}
              <a
                href="https://hg-growthlab.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline transition-colors"
              >
                HG GrowthLab
              </a>
            </p>
          </div>

          <div className="flex gap-6 text-xs text-text-secondary font-inter">
            <a href="#" className="hover:text-gold transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gold transition-colors">Términos</a>
            <a href="#" className="hover:text-gold transition-colors">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
