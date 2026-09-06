'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Project } from '@/lib/types';
import { ProjectManagementModal } from '@/components/admin/project-management-modal';
import {
  Building2,
  Plus,
  MapPin,
  ShieldCheck,
  Edit2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function ProjectsPage() {
  const { role, projects, refreshProjects } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  if (role !== 'SUPER_ADMIN') {
    return (
      <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs">
        <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
        <h2 className="text-base font-black text-slate-900">
          Super Admin Privileges Required
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Project creation, geofence radius tuning, and supervisor account provisioning is restricted strictly to Super Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Project & Geofence Site Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure site centroids, radius parameters, and project supervisor credentials.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Construction Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">No Construction Sites Configured</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Begin by registering your first construction project with its GPS coordinates and geofence perimeter radius. You will also be prompted to provision site supervisor credentials.
            </p>
          </div>
          <button
            onClick={() => {
              setProjectToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Construction Site</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const googleMapsUrl =
              proj.target_latitude && proj.target_longitude
                ? `https://www.google.com/maps?q=${proj.target_latitude},${proj.target_longitude}`
                : null;

            return (
              <div
                key={proj.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-400 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {proj.code}
                    </span>
                    <button
                      onClick={() => {
                        setProjectToEdit(proj);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Edit Project & Geofence"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {proj.description || 'Infrastructure development site.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Developer / Client:</span>
                      <span className="font-semibold text-slate-800">
                        {proj.client_name || 'BuildCorp Infrastructure'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GPS Centroid:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {proj.target_latitude?.toFixed(5)}, {proj.target_longitude?.toFixed(5)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Geofence Radius:</span>
                      <span className="font-bold text-emerald-700">
                        {proj.geofence_radius_meters} meters
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {googleMapsUrl ? (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-bold"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View Map Pin</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">No coords</span>
                  )}

                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Enforcing</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refreshProjects()}
        projectToEdit={projectToEdit}
      />
    </div>
  );
}
