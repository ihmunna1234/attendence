'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Employee, TimesheetDayRecord, Project, DEFAULT_AVATAR } from '@/lib/types';
import { calculateHaversineDistance, formatDistance } from '@/lib/geofence';
import {
  ShieldCheck,
  MapPin,
  Clock,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Camera,
} from 'lucide-react';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  dayRecord: TimesheetDayRecord | null;
  project: Project | null;
}

export function AuditModal({
  isOpen,
  onClose,
  employee,
  dayRecord,
  project,
}: AuditModalProps) {
  if (!employee || !dayRecord) return null;

  const checkIn = dayRecord.checkIn;
  const checkOut = dayRecord.checkOut;
  const primaryLog = checkIn || checkOut;

  // Calculate distances
  const checkInDistance =
    checkIn?.latitude && checkIn?.longitude && project?.target_latitude && project?.target_longitude
      ? calculateHaversineDistance(
          checkIn.latitude,
          checkIn.longitude,
          project.target_latitude,
          project.target_longitude
        )
      : null;

  const googleMapsUrl = primaryLog?.latitude && primaryLog?.longitude
    ? `https://www.google.com/maps?q=${primaryLog.latitude},${primaryLog.longitude}`
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>Biometric & GPS Attendance Audit</span>
        </div>
      }
      description={`Auditing record for ${employee.full_name} on ${dayRecord.date}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={employee.reference_photo_url || DEFAULT_AVATAR}
              alt={employee.full_name}
              className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs"
            />
            <div>
              <h4 className="text-sm font-black text-slate-900">
                {employee.full_name}
              </h4>
              <p className="text-xs text-blue-600 font-bold">
                {employee.designation} • Iqama: {employee.iqama_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Audit Verdict:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                dayRecord.status === 'PRESENT'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : dayRecord.status === 'OUT_OF_RANGE'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {dayRecord.status}
            </span>
          </div>
        </div>

        {/* Side-by-Side Photo Comparison */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-blue-600" />
            Visual Biometric Comparison: Reference vs. Captured Snapshot
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Master Reference Photo */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Master Reference Headshot</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Baseline
                </span>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={employee.reference_photo_url || DEFAULT_AVATAR}
                  alt="Reference Headshot"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[11px] text-slate-500">Captured during employee onboarding</p>
            </div>

            {/* Right: Actual Attendance Snapshot */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                <span>Daily Punch Snapshot</span>
                {checkIn?.location_status === 'OUT_OF_RANGE' ? (
                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Out-of-Range Flag
                  </span>
                ) : (
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Live Snapshot
                  </span>
                )}
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {checkIn?.captured_photo_url || checkOut?.captured_photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={checkIn?.captured_photo_url || checkOut?.captured_photo_url}
                    alt="Daily Punch Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4">
                    <Camera className="w-8 h-8 mb-2 opacity-40" />
                    <span>No photo recorded for this date</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {checkIn ? `Punched at ${new Date(checkIn.timestamp).toLocaleTimeString()}` : 'Absent'}
              </p>
            </div>
          </div>
        </div>

        {/* Timestamps & Geofence Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check-In / Out Times */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Time Log Records
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Check-In:</span>
                <span className="font-bold text-slate-900">
                  {checkIn ? new Date(checkIn.timestamp).toLocaleTimeString() : 'Not Punched'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Check-Out:</span>
                <span className="font-bold text-slate-900">
                  {checkOut ? new Date(checkOut.timestamp).toLocaleTimeString() : 'Not Punched'}
                </span>
              </div>
            </div>
          </div>

          {/* GPS Location & Map Pin */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Geofence Position
              </h5>
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  View on Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Recorded Coords:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {primaryLog?.latitude && primaryLog?.longitude
                    ? `${primaryLog.latitude.toFixed(6)}, ${primaryLog.longitude.toFixed(6)}`
                    : 'Coordinates unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-slate-500 font-medium">Distance from Center:</span>
                <span className="font-bold text-slate-900">
                  {checkInDistance != null ? formatDistance(checkInDistance) : 'N/A'} (Allowed: {project?.geofence_radius_meters || 200}m)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition"
          >
            Close Audit
          </button>
        </div>
      </div>
    </Modal>
  );
}
