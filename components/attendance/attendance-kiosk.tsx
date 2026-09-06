'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth-context';
import { Employee, AttendanceLog, AttendanceType, LocationStatus, DEFAULT_AVATAR } from '@/lib/types';
import { getEmployees, createAttendanceLog, getAttendanceLogs } from '@/lib/db';
import { checkGeofence, formatDistance, getLocationStatusBadge } from '@/lib/geofence';
import { CameraViewfinder } from './camera-viewfinder';
import {
  LogIn,
  LogOut,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  User,
  ShieldAlert,
  Sliders,
  History,
} from 'lucide-react';

export function AttendanceKiosk() {
  const { activeProject } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Real Device GPS Sensor State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Submission & Success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentPunches, setRecentPunches] = useState<AttendanceLog[]>([]);
  const [lastPunchSuccess, setLastPunchSuccess] = useState<AttendanceLog | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!activeProject) return;
    const emps = getEmployees(activeProject.id).filter((e) => e.status === 'ACTIVE');
    setEmployees(emps);
    if (emps.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(emps[0].id);
    }

    const logs = getAttendanceLogs({
      projectId: activeProject.id,
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    });
    setRecentPunches(logs.slice(0, 6));
  }, [activeProject, selectedEmployeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Acquire real GPS coordinates from browser Geolocation API
  const refreshLocation = useCallback(() => {
    if (!activeProject) return;

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setGpsError(error.message || 'Unable to retrieve device GPS location.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  }, [activeProject]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const geofenceResult = checkGeofence(
    gpsLocation?.lat,
    gpsLocation?.lng,
    activeProject?.target_latitude,
    activeProject?.target_longitude,
    activeProject?.geofence_radius_meters || 200
  );

  const statusBadge = getLocationStatusBadge(geofenceResult.status);

  const filteredEmployees = employees.filter((e) =>
    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.iqama_number.includes(searchQuery) ||
    e.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExecuteAttendance = async (type: AttendanceType) => {
    if (!selectedEmployee) {
      setErrorMessage('Please select an employee first.');
      return;
    }

    if (!capturedPhoto) {
      setErrorMessage('A live facial snapshot is required before punching in/out.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newLog = createAttendanceLog({
        employee_id: selectedEmployee.id,
        project_id: activeProject!.id,
        type,
        timestamp: new Date().toISOString(),
        captured_photo_url: capturedPhoto,
        latitude: gpsLocation?.lat ?? null,
        longitude: gpsLocation?.lng ?? null,
        location_status: geofenceResult.status,
      });

      if (geofenceResult.isWithin) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#06b6d4'],
        });
      }

      setLastPunchSuccess(newLog);
      loadData();
      setCapturedPhoto(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record attendance';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white shadow-xl shadow-blue-500/15">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Biometric Station (Site Supervisor Only)
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Daily Attendance Kiosk
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-0.5">
            Project: <strong className="font-bold underline">{activeProject?.name}</strong> ({activeProject?.code})
          </p>
        </div>

        {/* Live Device GPS Status */}
        <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/25 text-xs flex items-center gap-2 text-white">
          <MapPin className="w-4 h-4 text-emerald-300" />
          <span className="font-bold text-xs">
            {isLocating ? 'Acquiring GPS...' : gpsLocation ? 'GPS Geofence Active' : 'Waiting for Device GPS'}
          </span>
        </div>
      </div>

      {/* Main Grid: Left = Worker & Camera, Right = Verification & Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worker Select & Live Camera (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Worker Picker */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                Step 1: Select Employee from Site Roster
              </label>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {employees.length} active workers
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search worker by name, Iqama, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">No active workers found</p>
                <p className="text-[11px] text-slate-400">Add employees in the Workforce Directory first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmployeeId;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setCapturedPhoto(null);
                      }}
                      className={`p-3 rounded-2xl text-left border transition flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={emp.reference_photo_url || DEFAULT_AVATAR}
                        alt={emp.full_name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-300"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                          {emp.full_name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {emp.designation}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Iqama: {emp.iqama_number}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Camera Viewfinder */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <CameraViewfinder
              onCapture={(compressed) => setCapturedPhoto(compressed)}
              capturedImage={capturedPhoto}
              onRetake={() => setCapturedPhoto(null)}
              title="Step 2: Biometric Facial Verification"
              guideText="Look directly at camera & align face"
            />
          </div>
        </div>

        {/* Right Column: Worker Card, GPS Check, Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Selected Worker Overview */}
          {selectedEmployee && (
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Selected Worker Card
              </h3>
              <div className="flex items-start gap-3.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedEmployee.reference_photo_url || DEFAULT_AVATAR}
                  alt={selectedEmployee.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-600 shadow-sm shrink-0"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {selectedEmployee.full_name}
                  </h4>
                  <p className="text-xs text-blue-600 font-semibold">
                    {selectedEmployee.designation}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Iqama: {selectedEmployee.iqama_number}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    STATUS: ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GPS Geofence Audit Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Step 3: Geofence Location Verification
              </h3>
              <button
                type="button"
                onClick={refreshLocation}
                disabled={isLocating}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-bold"
              >
                {isLocating ? 'Acquiring...' : 'Refresh GPS'}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Distance to Site Center:</span>
                <span className="font-mono font-bold text-slate-900">
                  {geofenceResult.distanceMeters >= 0 ? formatDistance(geofenceResult.distanceMeters) : 'Calculating...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Allowed Perimeter:</span>
                <span className="font-mono text-slate-700 font-bold">
                  {activeProject?.geofence_radius_meters || 200} meters
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Coordinates:</span>
                <span className="font-mono text-[11px] text-slate-600">
                  {gpsLocation ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lng.toFixed(5)}` : 'N/A'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Audit Verdict:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.className}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusBadge.bgDot}`} />
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {geofenceResult.status === 'OUT_OF_RANGE' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Worker is currently outside the {activeProject?.geofence_radius_meters}m site radius. Punching will record an <strong>OUT_OF_RANGE</strong> audit flag for site records.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: Check-In & Check-Out */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleExecuteAttendance('CHECK_IN')}
                disabled={isSubmitting || !selectedEmployee || !capturedPhoto}
                className="min-h-[52px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/25 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {isSubmitting ? 'Recording...' : 'PUNCH IN'}
              </button>

              <button
                type="button"
                onClick={() => handleExecuteAttendance('CHECK_OUT')}
                disabled={isSubmitting || !selectedEmployee || !capturedPhoto}
                className="min-h-[52px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-black bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/25 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                {isSubmitting ? 'Recording...' : 'PUNCH OUT'}
              </button>
            </div>

            {!capturedPhoto && (
              <p className="text-[11px] text-center text-slate-500 font-medium">
                Snap face photo in Step 2 to enable Punch In/Out
              </p>
            )}
          </div>

          {/* Confirmation Card upon punch */}
          {lastPunchSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs animate-in zoom-in-95 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Punch Successfully Recorded!</span>
              </div>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lastPunchSuccess.captured_photo_url}
                  alt="Snapshot"
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-300"
                />
                <div className="text-[11px] space-y-0.5">
                  <p className="font-bold text-slate-900">{lastPunchSuccess.employee?.full_name}</p>
                  <p className="text-emerald-700 font-semibold">
                    {lastPunchSuccess.type} at {new Date(lastPunchSuccess.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="font-mono text-[10px] text-emerald-600">
                    Status: {lastPunchSuccess.location_status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Punch Activity Feed */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Today&apos;s Live Station Activity
          </h3>
          <span className="text-[11px] text-slate-500 font-semibold">
            Real-time biometric log
          </span>
        </div>

        {recentPunches.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No punches recorded yet today on this station.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentPunches.map((punch) => {
              const badge = getLocationStatusBadge(punch.location_status);
              return (
                <div
                  key={punch.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={punch.captured_photo_url}
                    alt={punch.employee?.full_name || 'Worker'}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate text-slate-900">
                      {punch.employee?.full_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                      <span className={punch.type === 'CHECK_IN' ? 'text-emerald-600 font-bold' : 'text-blue-600 font-bold'}>
                        {punch.type}
                      </span>
                      <span>•</span>
                      <span>{new Date(punch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

      {/* Mobile Sticky Quick Punch Action Bar (Thumb-reach when photo ready) */}
      {capturedPhoto && selectedEmployee && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 z-30 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => handleExecuteAttendance('CHECK_IN')}
            disabled={isSubmitting}
            className="flex-1 min-h-[48px] py-2.5 px-3 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Punching...' : 'PUNCH IN'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleExecuteAttendance('CHECK_OUT')}
            disabled={isSubmitting}
            className="flex-1 min-h-[48px] py-2.5 px-3 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>{isSubmitting ? 'Punching...' : 'PUNCH OUT'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
