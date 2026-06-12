import Link from 'next/link';
import { Scissors, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — BarberFlow',
  description: 'Términos y condiciones del servicio BarberFlow para barberías en Chile.',
};

export default function TerminosPage() {
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
          <h1 className="font-sora text-3xl sm:text-4xl font-extrabold mb-3">Términos y Condiciones</h1>
          <p className="text-text-secondary text-sm">Última actualización: junio de 2025</p>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-text-secondary">

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">1. Aceptación de los términos</h2>
            <p>
              Al registrarse y utilizar BarberFlow, usted acepta estos Términos y Condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar el servicio. Estos términos se rigen por las leyes de la República de Chile.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">2. Descripción del servicio</h2>
            <p>
              BarberFlow es una plataforma de software como servicio (SaaS) que permite a dueños de barberías gestionar sus reservas de citas en línea. El servicio incluye: página pública de reservas, panel administrativo, estadísticas del negocio y gestión de horarios.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">3. Suscripción y pagos</h2>
            <div className="flex flex-col gap-3">
              <p>
                <strong className="text-text-primary">Plan Individual Mensual:</strong> Se factura mensualmente. Precio de lanzamiento $12 USD/mes (sujeto a cambios con 30 días de aviso).
              </p>
              <p>
                <strong className="text-text-primary">Plan Individual Anual:</strong> Se factura una vez al año. Precio $120 USD/año.
              </p>
              <p>
                <strong className="text-text-primary">Plan Full Equipo:</strong> Se factura mensualmente. Precio $40.000 CLP/mes, incluye hasta 4 barberos activos.
              </p>
              <p>
                Los precios no incluyen IVA. BarberFlow se reserva el derecho de modificar precios con al menos 30 días de aviso previo a los usuarios activos.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">4. Período de prueba</h2>
            <p>
              BarberFlow ofrece un período de prueba gratuito de <strong className="text-text-primary">14 días</strong> sin necesidad de ingresar datos de pago. Al término del período de prueba, el servicio se suspende automáticamente si no se activa una suscripción.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">5. Cancelación</h2>
            <p>
              Usted puede cancelar su suscripción en cualquier momento, sin penalizaciones. Al cancelar:
            </p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2 mt-2">
              <li>Conserva acceso hasta el fin del período pagado</li>
              <li>Sus datos se mantienen disponibles por 30 días adicionales para descarga</li>
              <li>Pasados los 30 días, los datos se eliminan permanentemente</li>
              <li>No se realizan reembolsos proporcionales por períodos no utilizados</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">6. Uso aceptable</h2>
            <p>El usuario se compromete a:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 pl-2 mt-2">
              <li>Usar el servicio únicamente para fines lícitos relacionados con su negocio de barbería</li>
              <li>No intentar acceder a datos de otras barberías</li>
              <li>No utilizar el servicio para enviar spam o comunicaciones no solicitadas</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            </ul>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">7. Disponibilidad del servicio</h2>
            <p>
              BarberFlow se compromete a mantener una disponibilidad del 99% mensual. Pueden existir ventanas de mantenimiento programadas, que serán comunicadas con anticipación. No nos hacemos responsables por interrupciones causadas por terceros (proveedor de hosting, servicios de infraestructura).
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">8. Propiedad intelectual</h2>
            <p>
              Todo el software, diseño, marca y contenido de BarberFlow es propiedad de HG GrowthLab. Los datos de su barbería (clientes, citas, servicios) son de su propiedad y usted mantiene todos los derechos sobre ellos.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">9. Limitación de responsabilidad</h2>
            <p>
              BarberFlow no será responsable por pérdidas de negocio, lucro cesante ni daños indirectos derivados del uso o imposibilidad de uso del servicio. La responsabilidad total de BarberFlow no excederá el monto pagado en los últimos 3 meses de suscripción.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">10. Jurisdicción</h2>
            <p>
              Cualquier disputa derivada de estos términos será sometida a los tribunales ordinarios de justicia de la ciudad de Santiago, República de Chile, renunciando las partes a cualquier otro fuero.
            </p>
          </section>

          <section>
            <h2 className="font-sora text-xl font-bold text-text-primary mb-3">11. Contacto</h2>
            <p>
              Para consultas sobre estos términos:{' '}
              <a href="mailto:legal@hggrowthlab.cl" className="text-gold hover:underline">legal@hggrowthlab.cl</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-secondary">
          <p>&copy; {new Date().getFullYear()} BarberFlow by HG GrowthLab</p>
          <div className="flex gap-5">
            <Link href="/privacidad" className="hover:text-gold transition-colors">Privacidad</Link>
            <Link href="/terminos" className="text-gold">Términos</Link>
            <Link href="/soporte" className="hover:text-gold transition-colors">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
