'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { KPIMetrics, AttendanceLog } from '@/lib/types';
import { getKPIMetrics, getAttendanceLogs } from '@/lib/db';
import { getLocationStatusBadge } from '@/lib/geofence';
import { OnboardingDialog } from '@/components/employees/onboarding-dialog';
import {
  Camera,
  CalendarCheck2,
  Users,
  UserPlus,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  History,
} from 'lucide-react';

export function ProjectManagerDashboard() {
  const { activeProject, user } = useAuth();
  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalActiveProjects: 1,
    totalRegisteredWorkers: 0,
    todayTurnoutPercentage: 0,
    todayPresentCount: 0,
    todayViolationsCount: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const loadData = useCallback(() => {
    if (!activeProject) return;
    const kpi = getKPIMetrics(activeProject.id);
    setMetrics(kpi);

    const logs = getAttendanceLogs({
      projectId: activeProject.id,
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    });
    setRecentLogs(logs.slice(0, 8));
  }, [activeProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!activeProject) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-sm text-slate-500 font-medium">No project assigned to this account.</p>
      </div>
    );
  }

  const googleMapsUrl =
    activeProject.target_latitude && activeProject.target_longitude
      ? `https://www.google.com/maps?q=${activeProject.target_latitude},${activeProject.target_longitude}`
      : null;

  return (
    <div className="space-y-6">
      {/* Supervisor Project Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Site Supervisor Operations Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {activeProject.name}
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 flex flex-wrap items-center gap-3 font-medium">
              <span>Code: <strong className="font-mono">{activeProject.code}</strong></span>
              <span>•</span>
              <span>Client: {activeProject.client_name || 'Standard Client'}</span>
              <span>•</span>
              <span>Supervisor: {user?.full_name || user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/attendance"
              className="px-4 py-2.5 rounded-2xl text-xs font-black bg-white text-blue-700 hover:bg-blue-50 shadow-md transition flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-blue-600" />
              <span>Launch Live Kiosk</span>
            </Link>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-900/50 hover:bg-blue-900 text-white border border-white/30 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Worker</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Workers */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Workforce
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalRegisteredWorkers}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-blue-600 font-bold block sm:inline">Active Workers</span>
          </div>
        </div>

        {/* Turnout % */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CalendarCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Turnout
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.todayTurnoutPercentage}%
            </h3>
            <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold block truncate">
              {metrics.todayPresentCount}/{metrics.totalRegisteredWorkers} on duty
            </span>
          </div>
        </div>

        {/* Within Geofence */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fence Radius
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {activeProject.geofence_radius_meters}m
            </h3>
            <span className="text-[9px] sm:text-[10px] text-cyan-600 font-bold block sm:inline">Haversine</span>
          </div>
        </div>

        {/* Violations */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              GPS Flags
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.todayViolationsCount}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold block sm:inline">Out-of-Range</span>
          </div>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shortcut 1: Attendance Kiosk */}
        <Link
          href="/attendance"
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition">
                Take Daily Attendance (Live Kiosk)
              </h4>
              <p className="text-xs text-slate-500">
                Live webcam snapshot + instant Haversine GPS distance audit.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Shortcut 2: Monthly Timesheet */}
        <Link
          href="/timesheet"
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 transition group flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition">
                Monthly Timesheet & Audit
              </h4>
              <p className="text-xs text-slate-500">
                1–31 Matrix grid with side-by-side photo comparison modal.
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Geofence Centroid Info Card */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Site Geofence Centroid
            </h4>
            <p className="text-xs font-mono font-bold text-slate-800">
              Lat: {activeProject.target_latitude?.toFixed(6)} • Lng: {activeProject.target_longitude?.toFixed(6)} ({activeProject.geofence_radius_meters}m radius)
            </p>
          </div>
        </div>

        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition flex items-center gap-1.5"
          >
            <span>Open Site in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Recent Today's Punches */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Today&apos;s Live Site Attendance Feed
          </h3>
          <Link
            href="/timesheet"
            className="text-xs text-blue-600 hover:text-blue-700 font-bold"
          >
            View Full Matrix →
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No attendance punches recorded yet today. Click &quot;Launch Live Kiosk&quot; to begin.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {recentLogs.map((log) => {
              const badge = getLocationStatusBadge(log.location_status);
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={log.captured_photo_url}
                    alt={log.employee?.full_name || 'Worker'}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-slate-900">
                      {log.employee?.full_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span className={log.type === 'CHECK_IN' ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}>
                        {log.type}
                      </span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OnboardingDialog
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
