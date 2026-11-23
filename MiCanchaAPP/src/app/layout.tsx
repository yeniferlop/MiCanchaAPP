
import './globals.css';

import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { Toaster } from "@/components/ui/toaster";
import { AccessibilityButton } from '@/components/AccessibilityButton';

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

export const metadata: Metadata = {
  title: 'MiCanchaApp',
  description: 'Reserva canchas de fútbol de forma fácil y rápida.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className="font-body antialiased min-h-screen flex flex-col"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {children}
        <Toaster />
        <AccessibilityButton />
      </body>
    </html>
  );
}
