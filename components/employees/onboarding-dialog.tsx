'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { createEmployee, isIqamaDuplicate } from '@/lib/db';
import { compressImage } from '@/lib/image-compression';
import { Modal } from '@/components/ui/modal';
import { CameraViewfinder } from '@/components/attendance/camera-viewfinder';
import {
  UserPlus,
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
} from 'lucide-react';

const employeeFormSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  iqamaNumber: z
    .string()
    .regex(/^[1-2][0-9]{9}$/, 'Iqama number must be a valid 10-digit number starting with 1 or 2'),
  designation: z.string().min(2, 'Job title / designation is required'),
  mobileNumber: z
    .string()
    .min(8, 'Mobile number is required')
    .regex(/^\+?[0-9\s-]{8,20}$/, 'Invalid phone number format'),
});

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProjectId?: string;
}

export function OnboardingDialog({ isOpen, onClose, onSuccess, initialProjectId }: OnboardingDialogProps) {
  const { activeProject, projects, role } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId && initialProjectId !== 'ALL'
      ? initialProjectId
      : (activeProject?.id || projects[0]?.id || '')
  );

  useEffect(() => {
    if (initialProjectId && initialProjectId !== 'ALL') {
      setSelectedProjectId(initialProjectId);
    } else if (activeProject?.id) {
      setSelectedProjectId(activeProject.id);
    } else if (projects[0]?.id) {
      setSelectedProjectId(projects[0].id);
    }
  }, [initialProjectId, activeProject, projects]);

  const [fullName, setFullName] = useState('');
  const [iqamaNumber, setIqamaNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobileNumber, setMobileNumber] = useState('+966 ');

  // Media
  const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
  const [iqamaDocUrl, setIqamaDocUrl] = useState<string | null>(null);
  const [iqamaDocName, setIqamaDocName] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<'WEBCAM' | 'UPLOAD'>('WEBCAM');

  // Form State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIqamaDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Iqama document must be less than 5MB.');
      return;
    }

    setIqamaDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setIqamaDocUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, { maxWidth: 600, maxHeight: 600, quality: 0.8 });
      setReferencePhoto(compressed);
    } catch {
      setSubmitError('Could not process photo file.');
    }
  };

  const resetForm = () => {
    setFullName('');
    setIqamaNumber('');
    setDesignation('');
    setMobileNumber('+966 ');
    setReferencePhoto(null);
    setIqamaDocUrl(null);
    setIqamaDocName(null);
    setFormErrors({});
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProject;
    if (!targetProject) {
      setSubmitError('Please create a project site in Projects first before registering employees.');
      return;
    }

    const validation = employeeFormSchema.safeParse({
      fullName,
      iqamaNumber,
      designation,
      mobileNumber,
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
    setFormErrors({});

    if (isIqamaDuplicate(targetProject.id, iqamaNumber)) {
      setSubmitError(
        `Iqama number "${iqamaNumber}" is already registered in ${targetProject.name}. Duplicate entries are prohibited.`
      );
      return;
    }

    if (!referencePhoto) {
      setSubmitError('A reference front-facing facial photo is mandatory for biometric auditing.');
      return;
    }

    setIsSubmitting(true);

    try {
      createEmployee({
        project_id: targetProject.id,
        full_name: fullName.trim(),
        iqama_number: iqamaNumber.trim(),
        designation: designation.trim(),
        mobile_number: mobileNumber.trim(),
        reference_photo_url: referencePhoto,
        iqama_document_url: iqamaDocUrl || undefined,
        status: 'ACTIVE',
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error registering employee';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetProject = projects.find((p) => p.id === selectedProjectId) || activeProject;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-600" />
          <span>Onboard New Site Employee</span>
        </div>
      }
      description={`Register worker into ${targetProject?.name || 'Project Site'} with Iqama ID & Biometric Headshot.`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Super Admin Project Site Selector */}
        {role === 'SUPER_ADMIN' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assign to Project Site *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition font-medium"
              required
            >
              {projects.length === 0 && (
                <option value="">No projects available (Create one first)</option>
              )}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Section 1: Metadata Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Worker Full Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Tariq Mohammad Al-Farisi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border ${
                formErrors.fullName ? 'border-rose-500' : 'border-slate-300'
              } text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white`}
            />
            {formErrors.fullName && (
              <p className="text-[10px] text-rose-600 mt-1">{formErrors.fullName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Iqama Identity Number (10 digits) *
            </label>
            <input
              type="text"
              maxLength={10}
              placeholder="e.g. 2489012345"
              value={iqamaNumber}
              onChange={(e) => setIqamaNumber(e.target.value.replace(/\D/g, ''))}
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-50 border ${
                formErrors.iqamaNumber ? 'border-rose-500' : 'border-slate-300'
              } text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white`}
            />
            {formErrors.iqamaNumber && (
              <p className="text-[10px] text-rose-600 mt-1">{formErrors.iqamaNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Job Title / Designation *
            </label>
            <input
              type="text"
              placeholder="e.g. Structural Steel Welder (6G)"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border ${
                formErrors.designation ? 'border-rose-500' : 'border-slate-300'
              } text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white`}
            />
            {formErrors.designation && (
              <p className="text-[10px] text-rose-600 mt-1">{formErrors.designation}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Mobile Number *
            </label>
            <input
              type="text"
              placeholder="+966 50 123 4567"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 border ${
                formErrors.mobileNumber ? 'border-rose-500' : 'border-slate-300'
              } text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white`}
            />
            {formErrors.mobileNumber && (
              <p className="text-[10px] text-rose-600 mt-1">{formErrors.mobileNumber}</p>
            )}
          </div>
        </div>

        {/* Section 2: Iqama Document Upload */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Iqama Identity Document (PDF or Image Scan)
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:border-blue-600 text-slate-800 flex items-center gap-2 transition shadow-xs">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>{iqamaDocName ? 'Change File' : 'Upload Iqama Document'}</span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                capture="environment"
                className="hidden"
                onChange={handleIqamaDocUpload}
              />
            </label>
            {iqamaDocName && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="truncate max-w-[200px]">{iqamaDocName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Reference Headshot Photo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-blue-600" />
              Reference Facial Photo (Audit Baseline) *
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() => setPhotoMode('WEBCAM')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  photoMode === 'WEBCAM'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Webcam Snap
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode('UPLOAD')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  photoMode === 'UPLOAD'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {photoMode === 'WEBCAM' ? (
            <CameraViewfinder
              onCapture={(compressed) => setReferencePhoto(compressed)}
              capturedImage={referencePhoto}
              onRetake={() => setReferencePhoto(null)}
              title="Employee Reference Headshot"
              guideText="Front-facing headshot for facial audit"
            />
          ) : (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
              {referencePhoto ? (
                <div className="flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referencePhoto}
                    alt="Uploaded reference"
                    className="w-24 h-24 rounded-full object-cover border-2 border-blue-600 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setReferencePhoto(null)}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Remove & Re-upload
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Upload a high-resolution front-facing photo of the worker.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-xs">
                      Browse Computer
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Registering...' : 'Complete Onboarding'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
