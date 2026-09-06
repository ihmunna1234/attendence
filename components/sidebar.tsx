'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Camera,
  CalendarCheck2,
  Users,
  Building2,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { role, activeProject } = useAuth();

  const navItems = [
    {
      label: role === 'SUPER_ADMIN' ? 'Global Dashboard' : 'Site Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
      roles: ['SUPER_ADMIN', 'PROJECT_MANAGER'],
    },
    {
      label: 'Daily Attendance Kiosk',
      href: '/attendance',
      icon: Camera,
      badge: 'Live GPS',
      // Strictly for site supervisors on-site!
      roles: ['PROJECT_MANAGER'],
    },
    {
      label: role === 'SUPER_ADMIN' ? 'Site Timesheets' : 'Monthly Timesheet',
      href: '/timesheet',
      icon: CalendarCheck2,
      badge: 'Audit',
      roles: ['SUPER_ADMIN', 'PROJECT_MANAGER'],
    },
    {
      label: role === 'SUPER_ADMIN' ? 'Global Workforce' : 'Site Workers Roster',
      href: '/employees',
      icon: Users,
      badge: null,
      roles: ['SUPER_ADMIN', 'PROJECT_MANAGER'],
    },
    {
      label: 'Project Management',
      href: '/projects',
      icon: Building2,
      badge: 'Admin',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 shadow-xs">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Project Context Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Scope</span>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                role === 'SUPER_ADMIN'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Site Supervisor'}
            </span>
          </div>
          <div className="font-extrabold text-xs text-slate-800 truncate">
            {role === 'SUPER_ADMIN'
              ? (activeProject ? activeProject.name : 'Global Oversight (All Sites)')
              : (activeProject?.name || 'Assigned Site')}
          </div>
          {activeProject && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                {activeProject.geofence_radius_meters}m fence • {activeProject.code}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Operations & Navigation
          </p>
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Info / Geofence Spec */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="rounded-xl p-3 bg-blue-50/70 border border-blue-100 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-blue-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Dual Geofence & Camera</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            {role === 'SUPER_ADMIN'
              ? 'Global oversight with automatic Haversine compliance auditing.'
              : 'On-site biometric attendance station active.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
