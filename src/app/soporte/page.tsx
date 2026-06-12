import Link from 'next/link';
import { Scissors, ArrowLeft, MessageCircle, Mail, Clock, BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soporte — BarberFlow',
  description: 'Centro de soporte de BarberFlow. Contacta nuestro equipo o encuentra respuestas a tus preguntas frecuentes.',
};

const channels = [
  {
    icon: <MessageCircle className="w-6 h-6 text-gold" />,
    title: 'WhatsApp',
    desc: 'Respuesta en menos de 2 horas en horario hábil.',
    action: 'Abrir WhatsApp',
    href: 'https://wa.me/56934022106?text=Hola%2C%20necesito%20ayuda%20con%20BarberFlow',
    primary: true,
  },
  {
    icon: <Mail className="w-6 h-6 text-gold" />,
    title: 'Correo electrónico',
    desc: 'Para consultas detalladas o documentación.',
    action: 'soporte@hggrowthlab.cl',
    href: 'mailto:soporte@hggrowthlab.cl',
    primary: false,
  },
];

const faqs = [
  {
    q: '¿Cómo cambio mis horarios de atención?',
    a: 'En tu panel → pestaña "Agenda" → sección "Mis Horarios". Puedes activar o desactivar días y configurar slots específicos.',
  },
  {
    q: '¿Cómo subo el logo o foto de mi barbería?',
    a: 'En tu panel → pestaña "Mi Perfil" → sube la imagen. Se usará como portada en tu página de reservas pública.',
  },
  {
    q: '¿Cómo comparto mi link de reservas con mis clientes?',
    a: 'Tu link es barberflow.app/b/tu-slug. Lo encuentras en tu panel → "Mi Perfil". Puedes copiarlo y enviarlo por WhatsApp, Instagram o donde quieras.',
  },
  {
    q: '¿Cómo agrego o edito mis servicios?',
    a: 'En tu panel → pestaña "Servicios". Puedes agregar, editar o desactivar cualquier servicio sin límite.',
  },
  {
    q: '¿Cómo bloqueo un día feriado o mis vacaciones?',
    a: 'En tu panel → pestaña "Agenda" → sección "Fechas Bloqueadas". Selecciona la fecha y agrega un motivo opcional.',
  },
  {
    q: '¿Cómo cancelo mi suscripción?',
    a: 'Contáctanos por WhatsApp o email y procesamos la cancelación el mismo día. Sin formularios complicados.',
  },
];

export default function SoportePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary font-inter">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
              <Scissors className="w-4 h-4 text-gold rotate-90" />
            </div>
            <span className="font-sora text-base font-bold tracking-tight">BarberFlow</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-text-secondary hover:text-gold text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-sora text-3xl sm:text-4xl font-extrabold mb-3">Centro de Soporte</h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            Estamos aquí para ayudarte. Elige el canal que prefieras o revisa las preguntas frecuentes abajo.
          </p>
        </div>

        {/* Contact channels */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {channels.map((ch) => (
            <a
              key={ch.title}
              href={ch.href}
              target={ch.href.startsWith('http') ? '_blank' : undefined}
              rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`flex flex-col gap-4 p-7 rounded-2xl border transition-all hover:-translate-y-0.5 ${
                ch.primary
                  ? 'bg-gold/10 border-gold/30 hover:border-gold/50'
                  : 'bg-surface-dark border-white/5 hover:border-white/10'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-surface-light border border-white/10 flex items-center justify-center">
                {ch.icon}
              </div>
              <div>
                <h3 className="font-sora text-lg font-bold mb-1">{ch.title}</h3>
                <p className="text-text-secondary text-sm mb-3">{ch.desc}</p>
                <span className={`text-sm font-semibold ${ch.primary ? 'text-gold' : 'text-text-secondary'}`}>
                  {ch.action} →
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Horario */}
        <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 flex items-start gap-4 mb-16">
          <Clock className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-sora font-bold text-text-primary mb-1">Horario de atención</h3>
            <p className="text-text-secondary text-sm">
              Lunes a viernes: 9:00 – 19:00 hrs (Chile Continental, GMT-3)<br />
              Sábados: 10:00 – 14:00 hrs<br />
              Domingos y feriados: Sin atención (respuesta el próximo día hábil)
            </p>
          </div>
        </div>

        {/* Quick FAQ */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-5 h-5 text-gold" />
            <h2 className="font-sora text-2xl font-bold">Preguntas frecuentes de soporte</h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-surface-dark border border-white/5 rounded-xl p-6">
                <h3 className="font-sora font-semibold text-text-primary text-sm mb-2">{faq.q}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} BarberFlow by HG GrowthLab</p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="hover:text-gold transition-colors">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gold transition-colors">Términos</Link>
            <Link href="/soporte" className="text-gold">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
