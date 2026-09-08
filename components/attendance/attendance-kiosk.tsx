'use client';

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/auth-context';
import { Employee, AttendanceLog, DEFAULT_AVATAR } from '@/lib/types';
import {
  getEmployees,
  createAttendanceLog,
  getAttendanceLogs,
  updateAttendanceOvertime,
} from '@/lib/db';
import { checkGeofence, formatDistance, getLocationStatusBadge } from '@/lib/geofence';
import { CameraViewfinder } from './camera-viewfinder';
import { Modal } from '@/components/ui/modal';
import {
  UserCheck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  Camera,
  Clock,
  Sparkles,
  Zap,
  Plus,
  Edit2,
  Calendar,
  Users,
  ShieldCheck,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export function AttendanceKiosk() {
  const { activeProject } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayLogs, setTodayLogs] = useState<AttendanceLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PRESENT' | 'OVERTIME'>('ALL');

  // Camera Attendance Modal State
  const [targetEmployee, setTargetEmployee] = useState<Employee | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Overtime Modal State
  const [overtimeEmployee, setOvertimeEmployee] = useState<Employee | null>(null);
  const [overtimeLog, setOvertimeLog] = useState<AttendanceLog | null>(null);
  const [overtimeHoursInput, setOvertimeHoursInput] = useState<string>('2');
  const [overtimeNotes, setOvertimeNotes] = useState<string>('');

  // Inspect Photo Modal
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Real Device GPS Sensor State
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Load employees and today's logs for the active project
  const loadData = useCallback(() => {
    if (!activeProject) return;
    const emps = getEmployees(activeProject.id).filter((e) => e.status === 'ACTIVE');
    setEmployees(emps);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const logs = getAttendanceLogs({
      projectId: activeProject.id,
      startDate: startOfDay,
    });
    setTodayLogs(logs);
  }, [activeProject]);

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
        setGpsError(error.message || 'Unable to retrieve GPS location.');
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

  // Geofence computation
  const geofenceResult = checkGeofence(
    gpsLocation?.lat,
    gpsLocation?.lng,
    activeProject?.target_latitude,
    activeProject?.target_longitude,
    activeProject?.geofence_radius_meters || 200
  );

  const statusBadge = getLocationStatusBadge(geofenceResult.status);

  // Map today's attendance logs by employee ID
  const todayLogMap = new Map<string, AttendanceLog>();
  todayLogs.forEach((l) => {
    if (!todayLogMap.has(l.employee_id)) {
      todayLogMap.set(l.employee_id, l);
    }
  });

  // Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.iqama_number.includes(searchQuery) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const log = todayLogMap.get(emp.id);
    const isPresent = Boolean(log);
    const hasOvertime = Boolean(log && (log.overtime_hours || 0) > 0);

    if (statusFilter === 'PENDING') return !isPresent;
    if (statusFilter === 'PRESENT') return isPresent;
    if (statusFilter === 'OVERTIME') return hasOvertime;
    return true;
  });

  // Calculate high-level summary counters
  const totalEmployees = employees.length;
  const presentCount = todayLogMap.size;
  const pendingCount = Math.max(0, totalEmployees - presentCount);
  const totalOvertimeHours = Array.from(todayLogMap.values()).reduce(
    (acc, cur) => acc + (cur.overtime_hours || 0),
    0
  );

  // Trigger Camera Modal for Employee
  const handleOpenAttendanceCamera = (emp: Employee) => {
    setTargetEmployee(emp);
    setCapturedPhoto(null);
    setActionError(null);
  };

  // Submit standard 10-Hour Attendance
  const handleSubmitAttendance = async () => {
    if (!targetEmployee || !activeProject) return;

    if (!capturedPhoto) {
      setActionError('Please look at the camera and snap a photo first.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      createAttendanceLog({
        employee_id: targetEmployee.id,
        project_id: activeProject.id,
        timestamp: new Date().toISOString(),
        type: 'CHECK_IN',
        captured_photo_url: capturedPhoto,
        latitude: gpsLocation?.lat || null,
        longitude: gpsLocation?.lng || null,
        location_status: geofenceResult.status,
        regular_hours: 10, // 10 Standard hours per day
        overtime_hours: 0,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore confetti error
      }

      setTargetEmployee(null);
      setCapturedPhoto(null);
      loadData();
    } catch {
      setActionError('Failed to record attendance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Overtime Entry Modal
  const handleOpenOvertimeModal = (emp: Employee) => {
    const log = todayLogMap.get(emp.id);
    if (!log) return;
    setOvertimeEmployee(emp);
    setOvertimeLog(log);
    setOvertimeHoursInput(log.overtime_hours ? log.overtime_hours.toString() : '2');
    setOvertimeNotes(log.notes || '');
  };

  // Save Overtime Hours
  const handleSaveOvertime = () => {
    if (!overtimeLog) return;
    const hoursNum = parseFloat(overtimeHoursInput);
    if (isNaN(hoursNum) || hoursNum < 0) {
      return;
    }

    updateAttendanceOvertime(overtimeLog.id, hoursNum, overtimeNotes.trim() || undefined);
    setOvertimeEmployee(null);
    setOvertimeLog(null);
    loadData();
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daily Site Attendance
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{todayDateFormatted}</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">1 Punch = 10 Hours Shift</span>
            </p>
          </div>

          {/* Project & Live Geofence Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-slate-800 truncate max-w-[150px]">
                {activeProject?.name || 'Site'}
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${statusBadge.className}`}
              title={
                geofenceResult.distanceMeters !== Infinity
                  ? `${formatDistance(geofenceResult.distanceMeters)} from centroid`
                  : 'GPS location'
              }
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.bgDot} animate-pulse`} />
              <span>{statusBadge.label}</span>
              {geofenceResult.distanceMeters !== Infinity && (
                <span className="text-[10px] font-mono opacity-80">
                  ({formatDistance(geofenceResult.distanceMeters)})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4 Overview Metric Chips */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Site Workers
            </span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {totalEmployees}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Marked Present (10h)
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-emerald-700">{presentCount}</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                ({totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Pending Today
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xl font-black text-amber-700 mt-0.5 block">
              {pendingCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                Total Overtime Logged
              </span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xl font-black text-blue-700 mt-0.5 block">
              +{totalOvertimeHours}h OT
            </span>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search worker by name, Iqama, trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All ({totalEmployees})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                statusFilter === 'PRESENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OVERTIME')}
              className={`px-3 py-1.5 rounded-xl transition shrink-0 ${
                statusFilter === 'OVERTIME'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Overtime ({Array.from(todayLogMap.values()).filter((l) => (l.overtime_hours || 0) > 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Workforce Attendance Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-900">No Workers Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'No registered workers match your current search query.'
              : 'There are no active workers registered for this construction site yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const log = todayLogMap.get(emp.id);
            const isPresent = Boolean(log);
            const overtimeHours = log?.overtime_hours || 0;
            const totalDayHours = (log?.regular_hours || 10) + overtimeHours;

            return (
              <div
                key={emp.id}
                className={`p-4 rounded-3xl border transition flex flex-col justify-between space-y-3.5 shadow-xs ${
                  isPresent
                    ? 'bg-emerald-50/30 border-emerald-200/90'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'
                }`}
              >
                {/* Top Row: Worker Photo, Name, Trade */}
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={emp.reference_photo_url || DEFAULT_AVATAR}
                    alt={emp.full_name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      {emp.full_name}
                    </h3>
                    <p className="text-xs text-blue-600 font-semibold truncate">
                      {emp.designation}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Iqama: {emp.iqama_number}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  {isPresent ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>10h Present</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                {/* Bottom Row / Action Area */}
                {isPresent && log ? (
                  <div className="pt-2.5 border-t border-emerald-100/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {/* Attendance Snapshot Thumbnail */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={log.captured_photo_url}
                          alt="Punch snapshot"
                          onClick={() => setInspectPhotoUrl(log.captured_photo_url)}
                          className="w-8 h-8 rounded-lg object-cover border border-emerald-300 cursor-pointer shadow-xs hover:scale-105 transition"
                          title="Click to view captured punch photo"
                        />
                        <div>
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Punched at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-bold text-emerald-800 text-xs">
                            {totalDayHours} Hours {overtimeHours > 0 ? `(10h + ${overtimeHours}h OT)` : 'Standard'}
                          </span>
                        </div>
                      </div>

                      {/* Overtime Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenOvertimeModal(emp)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition flex items-center gap-1 ${
                          overtimeHours > 0
                            ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                        }`}
                      >
                        <Zap className="w-3 h-3 text-purple-600" />
                        <span>{overtimeHours > 0 ? `+${overtimeHours}h OT` : '+ Overtime'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenAttendanceCamera(emp)}
                      className="w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 active:scale-98"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo & Punch (10h)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Camera Attendance Modal (Opens on Click Employee) */}
      <Modal
        isOpen={Boolean(targetEmployee)}
        onClose={() => {
          setTargetEmployee(null);
          setCapturedPhoto(null);
          setActionError(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Attendance Photo — {targetEmployee?.full_name}</span>
          </div>
        }
        description="Capturing photo will immediately credit 10 standard working hours for today."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Worker Reference Info */}
          {targetEmployee && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={targetEmployee.reference_photo_url || DEFAULT_AVATAR}
                  alt={targetEmployee.full_name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{targetEmployee.full_name}</h4>
                  <p className="text-[11px] text-blue-600 font-semibold">{targetEmployee.designation}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block">
                  Iqama: {targetEmployee.iqama_number}
                </span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block">
                  Credits 10 Hours
                </span>
              </div>
            </div>
          )}

          {/* Live Camera Viewfinder (Aspect 4:3 Container for Mobile) */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner aspect-4/3 flex items-center justify-center">
            <CameraViewfinder
              onCapture={(dataUrl) => setCapturedPhoto(dataUrl)}
              capturedImage={capturedPhoto}
              onRetake={() => setCapturedPhoto(null)}
              title="Align Worker Face in Frame"
              guideText="Position worker face directly in camera"
            />
          </div>

          {/* Live GPS Verification Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-slate-600 font-medium">GPS Geofence:</span>
              <span className="font-bold text-slate-800">
                {statusBadge.label}
              </span>
            </div>

            {geofenceResult.distanceMeters !== Infinity && (
              <span className="font-mono text-slate-500 text-[11px]">
                {formatDistance(geofenceResult.distanceMeters)} away
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setTargetEmployee(null);
                setCapturedPhoto(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmitAttendance}
              disabled={isSubmitting || !capturedPhoto}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Submit Attendance (10 Hours)'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Day-End Overtime Modal */}
      <Modal
        isOpen={Boolean(overtimeEmployee)}
        onClose={() => {
          setOvertimeEmployee(null);
          setOvertimeLog(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span>Day-End Overtime — {overtimeEmployee?.full_name}</span>
          </div>
        }
        description="Standard 10 working hours have already been counted for today. Add extra approved overtime."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Regular Shift:</span>
              <span className="font-bold text-slate-800 text-sm">10.0 Hours</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Total Today:</span>
              <span className="font-black text-purple-700 text-sm">
                {(10 + (parseFloat(overtimeHoursInput) || 0)).toFixed(1)} Hours
              </span>
            </div>
          </div>

          {/* Quick Overtime Preset Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Quick Overtime Presets
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['1', '1.5', '2', '3', '4'].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setOvertimeHoursInput(h)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                    overtimeHoursInput === h
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>

          {/* Custom Overtime Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Custom Overtime Hours (Dec)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="14"
              value={overtimeHoursInput}
              onChange={(e) => setOvertimeHoursInput(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>

          {/* Overtime Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Supervisor Notes / Task Scope
            </label>
            <input
              type="text"
              placeholder="e.g. Concrete curing, structural beam crane rigging"
              value={overtimeNotes}
              onChange={(e) => setOvertimeNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOvertimeEmployee(null);
                setOvertimeLog(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveOvertime}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Day-End Overtime</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Enlarge Punch Photo Modal */}
      <Modal
        isOpen={Boolean(inspectPhotoUrl)}
        onClose={() => setInspectPhotoUrl(null)}
        title="Captured Punch Snapshot"
        maxWidth="sm"
      >
        <div className="space-y-3 text-center">
          {inspectPhotoUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={inspectPhotoUrl} alt="Punch Snapshot" className="w-full h-auto object-cover" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setInspectPhotoUrl(null)}
            className="w-full py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            Close Preview
          </button>
        </div>
      </Modal>
    </div>
  );
}
