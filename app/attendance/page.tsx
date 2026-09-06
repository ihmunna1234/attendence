'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { AttendanceKiosk } from '@/components/attendance/attendance-kiosk';
import { ShieldCheck, UserCheck, LayoutDashboard, Building2, ArrowRight } from 'lucide-react';

export default function AttendancePage() {
  const { role, loginAsPreset, allUsers, projects } = useAuth();

  if (role === 'SUPER_ADMIN') {
    const firstSupervisor = allUsers.find((u) => u.role === 'PROJECT_MANAGER');
    const supervisorProject = projects.find((p) => p.id === firstSupervisor?.project_id);

    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Super Administrator Account
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily Attendance Kiosk is Reserved for Site Supervisors
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            The Daily Biometric & GPS Kiosk is an on-site tablet/workstation tool designed specifically for construction site supervisors to capture worker punches with live camera facial detection and GPS tags.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Executive Privileges Available to You:
          </h4>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Inspect real-time attendance logs across all active projects</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Export formatted Excel/CSV payroll reports for all sites</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span>Configure GPS geofence radiuses and provision site supervisor logins</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Global Dashboard</span>
          </Link>

          <Link
            href="/projects"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Manage Projects & Supervisors</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AttendanceKiosk />
    </div>
  );
}
