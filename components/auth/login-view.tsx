'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAdminMasterKey } from '@/lib/auth-config';
import { Modal } from '@/components/ui/modal';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  AlertCircle,
  MapPin,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  Settings2,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export function LoginView() {
  const { loginWithPasscode, login, projects } = useAuth();

  // Smart Passcode (Option 5) State
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email / Classic login toggle
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Change Admin Key Modal
  const [isChangeKeyOpen, setIsChangeKeyOpen] = useState(false);
  const [currentKeyInput, setCurrentKeyInput] = useState('');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [changeKeyError, setChangeKeyError] = useState<string | null>(null);
  const [changeKeySuccess, setChangeKeySuccess] = useState<string | null>(null);

  // Handle Smart Key Submit
  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const clean = passcode.trim();
    if (!clean) {
      setError('Please enter your site passcode or admin master key.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPasscode(clean);
      if (!res.success) {
        setError(res.error || 'Invalid access key. Please check your credentials.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Classic Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, emailPassword);
      if (!res.success) {
        setError(res.error || 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Changing Master Admin Key
  const handleChangeAdminKey = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeKeyError('Admin Master Key configuration is managed through environment settings.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Brand Showcase (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                GeoAttend
              </h1>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Smart Workforce Portal
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">
              One-Key Smart Attendance & Geofence System
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fast, frictionless access designed for mobile construction foremen and central headquarters administrators.
            </p>
          </div>
        </div>

        {/* Right Single-Box Login Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                System Access
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your access key to unlock your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsChangeKeyOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Change Master Admin Key"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Change Keys</span>
            </button>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Smart Passcode Form */}
          {!showEmailLogin ? (
            <form onSubmit={handlePasscodeLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Access Passcode or Site Key
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-3 text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Access Key or Site Passcode..."
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm font-mono rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 transition"
                    title={showPassword ? 'Hide Key' : 'Show Key'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <span>{loading ? 'Authenticating...' : 'Unlock & Enter Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Helpful Hint */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>How does Single-Key login work?</span>
                </div>
                <p className="leading-relaxed text-slate-500">
                  • <strong>Admin Master Key</strong>: Logs into Headquarters with full management across all sites.
                </p>
                <p className="leading-relaxed text-slate-500">
                  • <strong>Site Passcode</strong>: Logs a foreman directly into their assigned site.
                </p>
              </div>

              {/* Toggle to Classic Email Login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailLogin(true);
                    setError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition"
                >
                  Or sign in with email and password →
                </button>
              </div>
            </form>
          ) : (
            /* Classic Email Login Form */
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="admin@buildcorp.global"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying...' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailLogin(false);
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  ← Back to Smart Single-Key Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Change Admin Master Key Modal */}
      {isChangeKeyOpen && (
        <Modal
          isOpen={isChangeKeyOpen}
          onClose={() => setIsChangeKeyOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>Change Super Admin Master Key</span>
            </div>
          }
          description="Update your central administrator password anytime."
          maxWidth="md"
        >
          <form onSubmit={handleChangeAdminKey} className="space-y-4">
            {changeKeyError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{changeKeyError}</span>
              </div>
            )}

            {changeKeySuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{changeKeySuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Admin Key *
              </label>
              <input
                type="password"
                placeholder="Current Admin Key"
                value={currentKeyInput}
                onChange={(e) => setCurrentKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Admin Key *
              </label>
              <input
                type="text"
                placeholder="Enter new secret key (min 4 characters)"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsChangeKeyOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition"
              >
                Save New Key
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
