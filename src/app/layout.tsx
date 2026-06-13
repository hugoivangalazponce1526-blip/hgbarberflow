import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://hgbarberflow.cl"),
  title: "BarberFlow — Software de Reservas para Barberías en Chile | Desde $12/mes",
  description:
    "Automatiza las reservas de tu barbería en Chile. Sin comisiones, sin apps para tus clientes. Panel con estadísticas, gestión de horarios y página de reservas propia. Desde $12/mes.",
  keywords: [
    "sistema de reservas barbería",
    "software agenda barbería Chile",
    "reservas online barbería",
    "agenda barbería Chile",
    "app barbería sin comisiones",
  ],
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://hgbarberflow.cl",
    siteName: "BarberFlow",
    title: "BarberFlow — Software de Reservas para Barberías en Chile",
    description:
      "Deja de coordinar citas por WhatsApp. Tus clientes reservan solos, tú cobras más. Sin comisiones. Desde $12/mes.",
    images: [
      {
        url: "/images/dashboard-mockup.png",
        width: 1200,
        height: 630,
        alt: "BarberFlow — Panel de reservas para barberías",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BarberFlow — Software de Reservas para Barberías en Chile",
    description: "Sin comisiones. Sin apps. Solo tu barbería funcionando sola.",
    images: ["/images/dashboard-mockup.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable} overflow-x-hidden`}>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>

  );
}
