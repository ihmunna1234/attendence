'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  MapPin,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
} from 'lucide-react';

export function LoginView() {
  const { login, loginWithProject, projects } = useAuth();

  const [activeTab, setActiveTab] = useState<'PROJECT' | 'ADMIN'>('PROJECT');

  // Project Site Login state
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [projectPassword, setProjectPassword] = useState('');

  // Super Admin / Email Login state
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Common state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle Project Supervisor Login
  const handleProjectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProjectId) {
      setError('Please select a construction project site.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithProject(selectedProjectId, projectPassword);
      if (!res.success) {
        setError(res.error || 'Invalid supervisor password for this project.');
      }
    } catch {
      setError('An error occurred during project sign-in.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Admin / Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, adminPassword);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Brand Showcase Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                GeoAttend
              </h1>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Photo & GPS Intelligence
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">
              Enterprise Attendance & Geofence Verification Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Secure role-based authentication protecting project site perimeters with live biometric facial verification and Haversine GPS audits.
            </p>
          </div>

          {/* Key Security Pillars */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Project-Wise Isolation</span>
                <span className="text-slate-500 text-[11px]">Site supervisors access only their assigned construction site.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm text-xs">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Haversine GPS Perimeter</span>
                <span className="text-slate-500 text-[11px]">Live sensor validation with custom geofence radii.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Card Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h3>
            <p className="text-xs text-slate-500">
              Select your login method: Project Site Supervisor or Super Administrator.
            </p>
          </div>

          {/* Login Mode Selector Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('PROJECT');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'PROJECT'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Project Site Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'ADMIN'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Super Admin Login</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Project Site Supervisor Login */}
          {activeTab === 'PROJECT' && (
            <form onSubmit={handleProjectLogin} className="space-y-4">
              {projects.length === 0 ? (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2.5">
                  <Building2 className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs font-bold text-amber-900">
                    No Construction Projects Created Yet
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Please log in using the Super Administrator account first to create your initial project and supervisor credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ADMIN');
                      setError(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Switch to Super Admin Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select Construction Site *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition appearance-none"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Site Supervisor Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter supervisor password"
                        value={projectPassword}
                        onChange={(e) => setProjectPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Authenticating...' : 'Enter Site Kiosk & Dashboard'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </form>
          )}

          {/* Mode 2: Super Admin / Email Login */}
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="admin@buildcorp.global"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Administrator Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Super Administrator'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
