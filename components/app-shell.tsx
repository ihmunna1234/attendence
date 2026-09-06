'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { LoginView } from '@/components/auth/login-view';
import {
  LayoutDashboard,
  Camera,
  CalendarCheck2,
  Users,
  Building2,
} from 'lucide-react';

function ShellContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Mobile Bottom Nav Items
  const mobileNavItems =
    role === 'PROJECT_MANAGER'
      ? [
          { label: 'Overview', href: '/', icon: LayoutDashboard },
          { label: 'Kiosk', href: '/attendance', icon: Camera, primary: true },
          { label: 'Timesheet', href: '/timesheet', icon: CalendarCheck2 },
          { label: 'Workers', href: '/employees', icon: Users },
        ]
      : [
          { label: 'Dashboard', href: '/', icon: LayoutDashboard },
          { label: 'Projects', href: '/projects', icon: Building2 },
          { label: 'Timesheet', href: '/timesheet', icon: CalendarCheck2 },
          { label: 'Workforce', href: '/employees', icon: Users },
        ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Top Sticky Navigation */}
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex w-full">
        {/* Desktop Persistent Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Mobile Overlay Sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Icon-Based Floating Dock) */}
      <nav className="md:hidden fixed bottom-3 inset-x-4 bg-white/95 backdrop-blur-xl border border-slate-200/90 z-40 px-3 py-1.5 rounded-3xl flex items-center justify-around shadow-2xl shadow-slate-900/10">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-center relative -my-3 group"
                aria-label={item.label}
                title={item.label}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-600/30'
                      : 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-blue-600/30'
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-blue-600' : 'stroke-[1.8]'}`} />
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
}
