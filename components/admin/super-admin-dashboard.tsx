'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Project, AttendanceLog, KPIMetrics, Employee } from '@/lib/types';
import { getAttendanceLogs, getKPIMetrics, getEmployees } from '@/lib/db';
import { exportAttendanceLogsToExcel, exportAttendanceLogsToCSV } from '@/lib/export';
import { getLocationStatusBadge } from '@/lib/geofence';
import { ProjectManagementModal } from './project-management-modal';
import { Modal } from '@/components/ui/modal';
import {
  Building2,
  Users,
  CalendarCheck,
  ShieldAlert,
  Download,
  Plus,
  MapPin,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export function SuperAdminDashboard() {
  const { projects, refreshProjects } = useAuth();

  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalActiveProjects: 0,
    totalRegisteredWorkers: 0,
    todayTurnoutPercentage: 0,
    todayPresentCount: 0,
    todayViolationsCount: 0,
  });

  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filter States
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchWorker, setSearchWorker] = useState<string>('');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const kpi = getKPIMetrics(selectedProjectId === 'ALL' ? undefined : selectedProjectId);
    setMetrics(kpi);

    const fetchedLogs = getAttendanceLogs({
      projectId: selectedProjectId,
      employeeId: selectedEmployeeId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setLogs(fetchedLogs);

    const emps = getEmployees(selectedProjectId === 'ALL' ? undefined : selectedProjectId);
    setEmployees(emps);
  }, [selectedProjectId, selectedEmployeeId, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportExcel = () => {
    const projName = selectedProjectId === 'ALL'
      ? 'Global_Workforce'
      : projects.find((p) => p.id === selectedProjectId)?.name || 'Project';
    exportAttendanceLogsToExcel(logs, projName);
  };

  const handleExportCSV = () => {
    const projName = selectedProjectId === 'ALL'
      ? 'Global_Workforce'
      : projects.find((p) => p.id === selectedProjectId)?.name || 'Project';
    exportAttendanceLogsToCSV(logs, projName);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchWorker) return true;
    const q = searchWorker.toLowerCase();
    return (
      log.employee?.full_name.toLowerCase().includes(q) ||
      log.employee?.iqama_number.includes(q) ||
      log.project?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 text-white shadow-xl shadow-blue-500/15">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            Executive Oversight Center
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Super Admin Global Command Center
          </h1>
          <p className="text-xs text-blue-100/90 mt-1">
            Real-time biometric attendance intelligence and geofence monitoring across all construction sites.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectToEdit(null);
            setIsProjectModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>New Construction Site</span>
        </button>
      </div>

      {/* High-Level KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Active Projects */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active Sites
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalActiveProjects}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-emerald-600 font-bold block sm:inline">100% Geofenced</span>
          </div>
        </div>

        {/* KPI 2: Registered Workers */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Workers
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.totalRegisteredWorkers}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-purple-600 font-bold block sm:inline">Iqama Verified</span>
          </div>
        </div>

        {/* KPI 3: Today's Turnout */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CalendarCheck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Turnout
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.todayTurnoutPercentage}%
            </h3>
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold block truncate">
              {metrics.todayPresentCount}/{metrics.totalRegisteredWorkers} today
            </span>
          </div>
        </div>

        {/* KPI 4: Geofence Violations */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              GPS Flags
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {metrics.todayViolationsCount}
            </h3>
            <span className="text-[9px] sm:text-[10px] text-amber-600 font-bold block sm:inline">Out-of-Range</span>
          </div>
        </div>
      </div>

      {/* Projects Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-600">
            Active Construction Sites & GPS Geofences
          </h2>
          <span className="text-xs font-semibold text-slate-500">{projects.length} Sites configured</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Construction Sites Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Create your first project to set up GPS centroid coordinates, geofence radius, and project supervisor login credentials.
            </p>
            <button
              onClick={() => {
                setProjectToEdit(null);
                setIsProjectModalOpen(true);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Construction Site</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {proj.code}
                    </span>
                    <button
                      onClick={() => {
                        setProjectToEdit(proj);
                        setIsProjectModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Configure
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 line-clamp-1">
                    {proj.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {proj.description || 'Infrastructure engineering project.'}
                  </p>

                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GPS Centroid:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {proj.target_latitude?.toFixed(4)}, {proj.target_longitude?.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Fence Radius:</span>
                      <span className="font-bold text-emerald-700">
                        {proj.geofence_radius_meters} meters
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Client: {proj.client_name || 'BuildCorp'}</span>
                  <span className="text-blue-600 font-bold flex items-center gap-1">
                    Active Geofence <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project-Wise Data Explorer & Exports */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Project-Wise Attendance Explorer & Payroll Export
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect logs with exact GPS coordinates, distance deviations, and biometric snapshots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (XLSX)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          {/* Project filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Project Filter
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="ALL">All Active Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Specific Worker
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            >
              <option value="ALL">All Workers</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.iqama_number})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>

          {/* Search text */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Search Keyword
            </label>
            <input
              type="text"
              placeholder="Name or Iqama..."
              value={searchWorker}
              onChange={(e) => setSearchWorker(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 font-medium"
            />
          </div>
        </div>

        {/* Logs Data Table */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3">Snapshot</th>
                  <th className="py-3 px-3">Worker & Iqama</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">GPS Location</th>
                  <th className="py-3 px-3">Geofence Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      No attendance records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const badge = getLocationStatusBadge(log.location_status);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        {/* Snapshot thumbnail */}
                        <td className="py-2.5 px-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={log.captured_photo_url}
                            alt="Log Snapshot"
                            onClick={() => setPreviewPhotoUrl(log.captured_photo_url)}
                            className="w-10 h-10 rounded-xl object-cover cursor-pointer hover:scale-105 transition border border-slate-200 shadow-xs"
                            title="Click to view full photo"
                          />
                        </td>

                        {/* Worker Info */}
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">
                            {log.employee?.full_name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Iqama: {log.employee?.iqama_number}
                          </p>
                        </td>

                        {/* Project */}
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[150px]">
                            {log.project?.name}
                          </p>
                          <p className="text-[10px] text-blue-600 font-mono font-bold">
                            {log.project?.code}
                          </p>
                        </td>

                        {/* Timestamp */}
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </td>

                        {/* Punch Type */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              log.type === 'CHECK_IN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {log.type}
                          </span>
                        </td>

                        {/* GPS Coords */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {log.latitude && log.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}</span>
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>

                        {/* Geofence Status Badge */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.bgDot}`} />
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Project Management Modal */}
      <ProjectManagementModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          refreshProjects();
          loadData();
        }}
        projectToEdit={projectToEdit}
      />

      {/* Full Photo Preview Modal */}
      {previewPhotoUrl && (
        <Modal
          isOpen={Boolean(previewPhotoUrl)}
          onClose={() => setPreviewPhotoUrl(null)}
          title="Attendance Biometric Verification Snapshot"
          maxWidth="md"
        >
          <div className="space-y-3 text-center">
            <div className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPhotoUrl}
                alt="Full Snapshot"
                className="w-full max-h-[70vh] object-contain mx-auto rounded-xl"
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Live snapshot captured via HTML5 camera sensor during check-in/out.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
