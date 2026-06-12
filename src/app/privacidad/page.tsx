import Link from 'next/link';
import { Scissors, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad — BarberFlow',
  description: 'Política de privacidad y tratamiento de datos personales de BarberFlow conforme a la Ley 19.628 de Chile.',
};

export default function PrivacidadPage() {
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
        <div className="mb-10">
          <h1 className="font-sora text-3xl sm:text-4xl font-extrabold mb-3">Política de Privacidad</h1>
          <p className="text-text-secondary text-sm">Última actualización: junio de 2025</p>
        </div>

        <div className="prose prose-invert max-w-none flex flex-col gap-8 text-sm leading-relaxed text-text-secondary">

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">1. Responsable del tratamiento</h2>
            <p>
              HG GrowthLab, en adelante <strong className="text-text-primary">&ldquo;BarberFlow&rdquo;</strong>, es responsable del tratamiento de sus datos personales. Para consultas relacionadas con privacidad puede contactarnos en{' '}
              <a href="mailto:privacidad@hggrowthlab.cl" className="text-gold hover:underline">privacidad@hggrowthlab.cl</a>.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">2. Marco legal aplicable</h2>
            <p>
              El tratamiento de datos personales se rige por la <strong className="text-text-primary">Ley N° 19.628 sobre Protección de la Vida Privada</strong> de la República de Chile y sus modificaciones. BarberFlow opera exclusivamente en territorio chileno y cumple con los principios de licitud, finalidad, proporcionalidad y seguridad establecidos en dicha ley.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">3. Datos que recopilamos</h2>
            <p className="mb-3">Recopilamos los siguientes tipos de datos, según el tipo de usuario:</p>
            <div className="bg-surface-dark border border-white/5 rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="font-semibold text-text-primary mb-1">Dueños de barbería / barberos</p>
                <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                  <li>Nombre completo y correo electrónico (para la cuenta)</li>
                  <li>Nombre de la barbería, dirección y teléfono de contacto</li>
                  <li>Información de configuración del negocio (servicios, horarios, precios)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-text-primary mb-1">Clientes que reservan citas</p>
                <ul className="list-disc list-inside flex flex-col gap-1 pl-2">
                  <li>Nombre y número de teléfono/WhatsApp (solo para identificar la reserva)</li>
                  <li>No se requiere registro ni contraseña</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">4. Finalidad del tratamiento</h2>
            <p>Los datos se utilizan exclusivamente para:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2 mt-2">
              <li>Gestionar y confirmar reservas de citas</li>
              <li>Proveer el servicio de panel administrativo al barbero</li>
              <li>Comunicaciones operativas del servicio (cambios, notificaciones)</li>
              <li>Cumplir con obligaciones legales aplicables</li>
            </ul>
            <p className="mt-3">
              <strong className="text-text-primary">No vendemos ni cedemos datos personales a terceros</strong> con fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">5. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan en servidores de <strong className="text-text-primary">Supabase</strong>, proveedor con certificación SOC 2 Type II. Implementamos Row Level Security (RLS) a nivel de base de datos para garantizar que cada barbería accede únicamente a sus propios datos. Las contraseñas se almacenan cifradas mediante bcrypt.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">6. Derechos del titular</h2>
            <p>De conformidad con la Ley 19.628, usted tiene derecho a:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2 mt-2">
              <li><strong className="text-text-primary">Acceso:</strong> conocer qué datos tenemos sobre usted</li>
              <li><strong className="text-text-primary">Rectificación:</strong> corregir datos inexactos</li>
              <li><strong className="text-text-primary">Cancelación:</strong> solicitar la eliminación de sus datos</li>
              <li><strong className="text-text-primary">Oposición:</strong> oponerse a ciertos tratamientos</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, contáctenos en{' '}
              <a href="mailto:privacidad@hggrowthlab.cl" className="text-gold hover:underline">privacidad@hggrowthlab.cl</a>.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">7. Cookies</h2>
            <p>
              BarberFlow utiliza cookies técnicas estrictamente necesarias para el funcionamiento de la autenticación (sesión de usuario). No utilizamos cookies de seguimiento publicitario ni analítica de terceros.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho a actualizar esta política. Notificaremos cambios significativos por correo electrónico a los usuarios registrados con al menos 15 días de anticipación.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} BarberFlow by HG GrowthLab</p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="text-gold">Privacidad</Link>
            <Link href="/terminos" className="hover:text-gold transition-colors">Términos</Link>
            <Link href="/soporte" className="hover:text-gold transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
