'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  Building2,
  LogOut,
  ChevronDown,
  MapPin,
} from 'lucide-react';

export function Navbar() {
  const { role, activeProject, projects, setActiveProject, logout } = useAuth();
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-slate-900">
                  GeoAttend
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                  Light Edition
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Photo & Geolocation Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Project Scope Indicator / Switcher (Icon-Based on Mobile) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {role === 'SUPER_ADMIN' ? (
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-blue-400 transition"
                aria-label="Switch project scope"
                title={activeProject ? activeProject.name : 'All Projects (Global Scope)'}
              >
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="hidden sm:inline-block max-w-[180px] truncate">
                  {activeProject ? activeProject.name : 'All Projects'}
                </span>
                {activeProject && (
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 sm:hidden">
                    {activeProject.code}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showProjectMenu && (
                <div className="fixed inset-x-4 top-18 sm:absolute sm:left-0 sm:top-auto sm:mt-2 sm:w-72 rounded-2xl bg-white border border-slate-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Project Scope
                    </p>
                    <button
                      onClick={() => setShowProjectMenu(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 sm:hidden"
                    >
                      Close
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setActiveProject(null);
                      setShowProjectMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 hover:bg-slate-50 ${
                      !activeProject ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Global Oversight (All Projects)</span>
                  </button>
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p);
                        setShowProjectMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-start gap-2 hover:bg-slate-50 ${
                        activeProject?.id === p.id
                          ? 'text-blue-600 font-bold bg-blue-50/50'
                          : 'text-slate-600'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.code} • {p.geofence_radius_meters}m fence</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200"
              title={activeProject?.name || 'Assigned Site'}
            >
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline-block max-w-[200px] truncate">
                {activeProject?.name || 'Assigned Site'}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                {activeProject?.code}
              </span>
            </div>
          )}
        </div>

        {/* Right Actions: Clean Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition shadow-xs"
            title="Sign out of account"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
