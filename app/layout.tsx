import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'GeoAttend | Photo & Geolocation Attendance Management System',
  description: 'Production-ready biometric facial verification and GPS geofence workforce attendance system for construction and engineering sites.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-50 text-slate-900">
      <body className="min-h-full font-sans antialiased bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
