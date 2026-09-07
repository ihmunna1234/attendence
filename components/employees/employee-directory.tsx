'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Employee, DEFAULT_AVATAR } from '@/lib/types';
import { getEmployees, updateEmployee, deleteEmployee } from '@/lib/db';
import { OnboardingDialog } from './onboarding-dialog';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  UserPlus,
  Search,
  FileText,
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';

export function EmployeeDirectory() {
  const { activeProject, projects, role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [inspectEmployee, setInspectEmployee] = useState<Employee | null>(null);

  // Super Admin can view ALL projects or filter by a specific project site
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    role === 'SUPER_ADMIN' ? 'ALL' : (activeProject?.id || 'ALL')
  );

  useEffect(() => {
    if (role !== 'SUPER_ADMIN' && activeProject?.id) {
      setSelectedProjectId(activeProject.id);
    }
  }, [role, activeProject]);

  const loadEmployees = useCallback(() => {
    const projId = role === 'SUPER_ADMIN' ? selectedProjectId : activeProject?.id;
    const list = getEmployees(projId === 'ALL' ? undefined : projId);
    setEmployees(list);
  }, [role, selectedProjectId, activeProject]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const toggleEmployeeStatus = (emp: Employee) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateEmployee(emp.id, { status: nextStatus });
    loadEmployees();
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the project roster?`)) {
      deleteEmployee(id);
      loadEmployees();
      if (inspectEmployee?.id === id) setInspectEmployee(null);
    }
  };

  const filtered = employees.filter((e) => {
    const query = searchQuery.toLowerCase();
    const workerProject = projects.find((p) => p.id === e.project_id);
    const matchesSearch =
      e.full_name.toLowerCase().includes(query) ||
      e.iqama_number.includes(query) ||
      e.designation.toLowerCase().includes(query) ||
      (workerProject && workerProject.name.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter((e) => e.status === 'INACTIVE').length;

  const currentProjectName =
    selectedProjectId === 'ALL'
      ? `All Construction Sites (${projects.length} Total Sites, ${employees.length} Total Workers)`
      : (projects.find((p) => p.id === selectedProjectId)?.name || activeProject?.name || 'Assigned Site');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {role === 'SUPER_ADMIN' ? 'Workforce Directory' : 'Site Workforce'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {currentProjectName}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Super Admin Project Site Selector */}
          {role === 'SUPER_ADMIN' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
                title="Filter workers by project site"
              >
                <option value="ALL">🏢 All Construction Sites ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Onboard Worker Button */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 shrink-0 active:scale-95"
            title="Onboard New Worker"
            aria-label="Onboard New Worker"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Worker</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Workforce
          </span>
          <span className="text-xl font-black text-slate-900 mt-0.5 block">
            {employees.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Workers
          </span>
          <span className="text-xl font-black text-emerald-700 mt-0.5 block">
            {activeCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Inactive / Off
          </span>
          <span className="text-xl font-black text-slate-600 mt-0.5 block">
            {inactiveCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Site Coverage
          </span>
          <span className="text-xl font-black text-blue-700 mt-0.5 block">
            {selectedProjectId === 'ALL' ? `${projects.length} Sites` : '1 Site'}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by worker name, Iqama ID, designation, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0 self-end sm:self-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1.5 ${
                statusFilter === s
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {s === 'ALL' && <Users className="w-3.5 h-3.5" />}
              {s === 'ACTIVE' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {s === 'INACTIVE' && <XCircle className="w-3.5 h-3.5 text-slate-400" />}
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Employee Cards Grid */}
      {filtered.length === 0 ? (
        projects.length === 0 && role === 'SUPER_ADMIN' ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm">
            <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-900">
              No Construction Projects Created Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto mb-5">
              Before onboarding workforce personnel, please create your first construction site project.
            </p>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Go to Projects Management</span>
            </Link>
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm">
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">
              No employees registered
            </p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Try adjusting your search filter or onboard a new worker.
            </p>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs hover:bg-blue-500 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard First Worker</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => {
            const workerProject = projects.find((p) => p.id === emp.project_id);

            return (
              <div
                key={emp.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={emp.reference_photo_url || DEFAULT_AVATAR}
                        alt={emp.full_name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {emp.full_name}
                        </h4>
                        <p className="text-[11px] text-blue-600 font-semibold truncate">
                          {emp.designation}
                        </p>
                        {workerProject && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700 truncate max-w-[150px]">
                            {workerProject.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Iqama Number:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {emp.iqama_number}
                      </span>
                    </div>
                    {emp.mobile_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mobile:</span>
                        <span className="text-slate-700 font-medium">{emp.mobile_number}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Registered:</span>
                      <span className="text-slate-700">
                        {new Date(emp.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectEmployee(emp)}
                    className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition flex items-center gap-1.5"
                    title="Inspect Profile"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Inspect Profile</span>
                    <span className="sm:hidden">Inspect</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {emp.mobile_number && (
                      <a
                        href={`tel:${emp.mobile_number}`}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        title={`Call ${emp.mobile_number}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleEmployeeStatus(emp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      title={emp.status === 'ACTIVE' ? 'Set Inactive' : 'Activate Employee'}
                    >
                      {emp.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove from roster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboarding Dialog */}
      <OnboardingDialog
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={() => loadEmployees()}
        initialProjectId={selectedProjectId}
      />

      {/* Employee Detail & Iqama Document Inspector Modal */}
      {inspectEmployee && (
        <Modal
          isOpen={Boolean(inspectEmployee)}
          onClose={() => setInspectEmployee(null)}
          title="Employee Profile & Iqama Document"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspectEmployee.reference_photo_url || DEFAULT_AVATAR}
                alt={inspectEmployee.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md shrink-0"
              />
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {inspectEmployee.full_name}
                </h3>
                <p className="text-xs text-blue-600 font-bold">
                  {inspectEmployee.designation}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Iqama ID: {inspectEmployee.iqama_number}
                </p>
                {inspectEmployee.mobile_number && (
                  <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {inspectEmployee.mobile_number}
                  </p>
                )}
              </div>
            </div>

            {/* Iqama Document preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Iqama Document Archive
              </h4>
              {inspectEmployee.iqama_document_url ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={inspectEmployee.iqama_document_url}
                    alt="Iqama Document Scan"
                    className="w-full max-h-72 object-contain mx-auto rounded-xl"
                  />
                </div>
              ) : (
                <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 text-xs">
                  No scanned document uploaded for this worker.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectEmployee(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
