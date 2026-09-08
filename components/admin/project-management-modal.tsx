'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Project } from '@/lib/types';
import { createProject, updateProject, createUser, getUsers } from '@/lib/db';
import { Building2, MapPin, AlertCircle, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';

const GeofenceMapPicker = dynamic(
  () => import('./geofence-map-picker').then((mod) => mod.GeofenceMapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] rounded-2xl bg-slate-100 border border-slate-300 flex items-center justify-center text-xs text-slate-500 font-bold">
        Loading Interactive Geofence Map...
      </div>
    ),
  }
);

const projectFormSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  code: z.string().min(3, 'Project code must be at least 3 characters').regex(/^[A-Z0-9_-]+$/, 'Code should be uppercase alphanumeric (e.g. PRJ-RSC-05)'),
  targetLatitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  targetLongitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  geofenceRadiusMeters: z.number().min(50, 'Minimum radius is 50 meters').max(5000, 'Maximum radius is 5000 meters'),
  clientName: z.string().optional(),
});

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectToEdit?: Project | null;
}

export function ProjectManagementModal({
  isOpen,
  onClose,
  onSuccess,
  projectToEdit,
}: ProjectManagementModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientName, setClientName] = useState('');
  const [targetLat, setTargetLat] = useState('24.713552');
  const [targetLng, setTargetLng] = useState('46.675296');
  const [geofenceRadius, setGeofenceRadius] = useState('200');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);
  const [description, setDescription] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setCode(projectToEdit.code);
      setClientName(projectToEdit.client_name || '');
      setTargetLat(projectToEdit.target_latitude?.toString() || '24.713552');
      setTargetLng(projectToEdit.target_longitude?.toString() || '46.675296');
      setGeofenceRadius(projectToEdit.geofence_radius_meters.toString());
      setDescription(projectToEdit.description || '');
      setSupervisorEmail('');
      setSupervisorPassword(projectToEdit.passcode || '');
    } else {
      setName('');
      setCode(`PRJ-${Math.floor(100 + Math.random() * 900)}`);
      setClientName('');
      setTargetLat('24.713552');
      setTargetLng('46.675296');
      setGeofenceRadius('200');
      setDescription('');
      setSupervisorEmail('');
      setSupervisorPassword('');
    }
    setFormErrors({});
    setSubmitError(null);
  }, [projectToEdit, isOpen]);

  // Coordinate presets for testing
  const presets = [
    { label: 'Riyadh Central Hub', lat: '24.713552', lng: '46.675296' },
    { label: 'Red Sea Coastal Sector', lat: '25.683400', lng: '37.104500' },
    { label: 'NEOM Smart City Grid', lat: '28.005870', lng: '35.210450' },
    { label: 'Jeddah Waterfront Mall', lat: '21.543333', lng: '39.172778' },
    { label: 'Dammam Industrial Port', lat: '26.434421', lng: '50.103321' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const latNum = parseFloat(targetLat);
    const lngNum = parseFloat(targetLng);
    const radiusNum = parseInt(geofenceRadius, 10);

    const validation = projectFormSchema.safeParse({
      name,
      code: code.toUpperCase().trim(),
      targetLatitude: isNaN(latNum) ? 0 : latNum,
      targetLongitude: isNaN(lngNum) ? 0 : lngNum,
      geofenceRadiusMeters: isNaN(radiusNum) ? 200 : radiusNum,
      clientName,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (projectToEdit) {
        updateProject(projectToEdit.id, {
          name: name.trim(),
          code: code.toUpperCase().trim(),
          passcode: supervisorPassword.trim() || projectToEdit.passcode || code.toLowerCase(),
          target_latitude: latNum,
          target_longitude: lngNum,
          geofence_radius_meters: radiusNum,
          client_name: clientName.trim() || undefined,
          description: description.trim() || undefined,
        });

        // Update or create supervisor password if specified
        if (supervisorPassword.trim()) {
          const allUsers = getUsers();
          const existingSupervisor = allUsers.find(
            (u) => u.project_id === projectToEdit.id && u.role === 'PROJECT_MANAGER'
          );
          if (existingSupervisor) {
            existingSupervisor.password = supervisorPassword.trim();
            if (supervisorEmail.trim()) {
              existingSupervisor.email = supervisorEmail.trim().toLowerCase();
            }
          } else {
            const effectiveEmail = supervisorEmail.trim()
              ? supervisorEmail.trim().toLowerCase()
              : `supervisor.${projectToEdit.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@buildcorp.global`;
            createUser({
              email: effectiveEmail,
              password: supervisorPassword.trim(),
              role: 'PROJECT_MANAGER',
              project_id: projectToEdit.id,
              full_name: `Eng. Supervisor (${name})`,
            });
          }
        }
      } else {
        const created = createProject({
          name: name.trim(),
          code: code.toUpperCase().trim(),
          passcode: supervisorPassword.trim() || undefined,
          target_latitude: latNum,
          target_longitude: lngNum,
          geofence_radius_meters: radiusNum,
          client_name: clientName.trim() || undefined,
          description: description.trim() || undefined,
        });

        // Always provision dedicated supervisor account for project login
        const effectiveEmail = supervisorEmail.trim()
          ? supervisorEmail.trim().toLowerCase()
          : `supervisor.${created.code.toLowerCase().replace(/[^a-z0-9]/g, '')}@buildcorp.global`;

        createUser({
          email: effectiveEmail,
          password: supervisorPassword.trim() || undefined,
          role: 'PROJECT_MANAGER',
          project_id: created.id,
          full_name: `Eng. Supervisor (${name})`,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>{projectToEdit ? 'Edit Construction Site Project' : 'Create New Construction Project'}</span>
        </div>
      }
      description="Configure target GPS centroid, geofence radius, and project account login."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Riyadh Metro Line 4 Depot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            {formErrors.name && <p className="text-[10px] text-rose-600 mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Code (Unique) *
            </label>
            <input
              type="text"
              placeholder="e.g. PRJ-RML-04"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
            {formErrors.code && <p className="text-[10px] text-rose-600 mt-1">{formErrors.code}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Client / Master Developer
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Commission for Riyadh City"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Description / Scope
            </label>
            <input
              type="text"
              placeholder="e.g. Rail expansion and underground MEP"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Project Site Access Key & Supervisor Credentials */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
            <KeyRound className="w-4 h-4 text-blue-600" />
            <span>Site Access Key & Passcode (Instant Foreman Login)</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Site foremen & supervisors can log into this project site using either this Passcode or the Project Code.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Site Access Passcode / Password *
              </label>
              <div className="relative">
                <input
                  type={showSupervisorPassword ? 'text' : 'password'}
                  placeholder="Enter secure passcode"
                  value={supervisorPassword}
                  onChange={(e) => setSupervisorPassword(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-xs font-mono font-bold rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 transition"
                  title={showSupervisorPassword ? 'Hide Passcode' : 'Show Passcode'}
                >
                  {showSupervisorPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Supervisor Email (Optional)
              </label>
              <input
                type="email"
                placeholder="supervisor.site@buildcorp.global"
                value={supervisorEmail}
                onChange={(e) => setSupervisorEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Geofence Configuration with Interactive Map */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Interactive Site Centroid & Geofence Boundary Map
            </span>
            <span className="text-[11px] text-slate-500">
              Click map, search, or drag pin to position site
            </span>
          </div>

          {/* Interactive Map Picker */}
          <GeofenceMapPicker
            latitude={parseFloat(targetLat) || 24.713552}
            longitude={parseFloat(targetLng) || 46.675296}
            radiusMeters={parseInt(geofenceRadius, 10) || 200}
            projectName={name || 'Construction Site'}
            onChange={({ lat, lng, radius }) => {
              setTargetLat(lat.toString());
              setTargetLng(lng.toString());
              setGeofenceRadius(radius.toString());
            }}
          />

          {/* Quick presets */}
          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Quick Region Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setTargetLat(p.lat);
                    setTargetLng(p.lng);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 hover:border-blue-500 transition text-slate-700 shadow-xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Target Latitude (Dec) *
              </label>
              <input
                type="text"
                value={targetLat}
                onChange={(e) => setTargetLat(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
              />
              {formErrors.targetLatitude && (
                <p className="text-[10px] text-rose-600 mt-1">{formErrors.targetLatitude}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Target Longitude (Dec) *
              </label>
              <input
                type="text"
                value={targetLng}
                onChange={(e) => setTargetLng(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
              />
              {formErrors.targetLongitude && (
                <p className="text-[10px] text-rose-600 mt-1">{formErrors.targetLongitude}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Radius (Meters) *
              </label>
              <input
                type="number"
                min={50}
                max={5000}
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600"
              />
              {formErrors.geofenceRadiusMeters && (
                <p className="text-[10px] text-rose-600 mt-1">{formErrors.geofenceRadiusMeters}</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project & Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
