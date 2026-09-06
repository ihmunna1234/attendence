'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Employee, EmployeeTimesheetRow, TimesheetDayRecord, DEFAULT_AVATAR } from '@/lib/types';
import { getMonthlyTimesheetMatrix } from '@/lib/db';
import { exportTimesheetMatrixToExcel } from '@/lib/export';
import { AuditModal } from './audit-modal';
import {
  CalendarCheck2,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutGrid,
  CreditCard,
} from 'lucide-react';

export function TimesheetMatrix() {
  const { activeProject } = useAuth();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [matrix, setMatrix] = useState<EmployeeTimesheetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'CARDS' | 'GRID'>('CARDS');

  // Selected cell for audit modal
  const [auditTarget, setAuditTarget] = useState<{
    employee: Employee;
    dayRecord: TimesheetDayRecord;
  } | null>(null);

  const loadMatrix = useCallback(() => {
    if (!activeProject) return;
    const data = getMonthlyTimesheetMatrix(activeProject.id, selectedYear, selectedMonth);
    setMatrix(data);
  }, [activeProject, selectedYear, selectedMonth]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleExportExcel = () => {
    if (!activeProject) return;
    exportTimesheetMatrixToExcel(
      matrix,
      activeProject.name,
      selectedYear,
      selectedMonth
    );
  };

  const filteredMatrix = matrix.filter((row) =>
    row.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.employee.iqama_number.includes(searchQuery) ||
    row.employee.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Monthly Attendance Timesheet
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Site Matrix for <strong className="font-bold text-slate-800">{activeProject?.name || 'Assigned Site'}</strong>
          </p>
        </div>

        {/* Month Selector, View Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'CARDS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card view optimized for mobile & tablet screens"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === 'GRID'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard 31-day table matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Matrix</span>
            </button>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-bold text-slate-800 min-w-[120px] text-center">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Payroll (XLSX)</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Legend & Search */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roster in timesheet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Present (In Fence)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 font-medium">Out of Range Flag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 font-medium">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-600 font-medium">Weekend / Off</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: Mobile-Optimized Worker Cards View */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2 font-medium">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Scroll horizontally on any worker&apos;s day strip and <strong>tap any day</strong> to view biometric photo & GPS audit.</span>
            </div>
            <span className="font-bold shrink-0">{filteredMatrix.length} Workers</span>
          </div>

          {filteredMatrix.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-400 text-xs">
              No workers found matching your search.
            </div>
          ) : (
            filteredMatrix.map((row) => (
              <div
                key={row.employee.id}
                className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3.5 hover:border-blue-300 transition"
              >
                {/* Worker Info & Monthly Summary Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.employee.reference_photo_url || DEFAULT_AVATAR}
                      alt={row.employee.full_name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-slate-900 truncate">
                        {row.employee.full_name}
                      </h4>
                      <p className="text-xs text-blue-600 font-semibold truncate">
                        {row.employee.designation}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Iqama: {row.employee.iqama_number}
                      </p>
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                      <p className="text-[10px] font-bold uppercase text-emerald-600">Present</p>
                      <p className="text-sm font-black text-emerald-800">{row.totalPresent}</p>
                    </div>
                    <div className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-[10px] font-bold uppercase text-amber-600">Flags</p>
                      <p className="text-sm font-black text-amber-800">{row.totalViolations}</p>
                    </div>
                    <div className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                      <p className="text-[10px] font-bold uppercase text-rose-600">Absent</p>
                      <p className="text-sm font-black text-rose-800">{row.totalAbsent}</p>
                    </div>
                  </div>
                </div>

                {/* Horizontal Touch Scroll Day Chips Strip */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-2">
                    <span>Attendance Calendar: {monthNames[selectedMonth - 1]} (Days 1–{daysInMonth})</span>
                    <span className="text-[10px] text-blue-600">Swipe to view days →</span>
                  </div>
                  <div className="overflow-x-auto pb-1.5 -mx-1 px-1 flex items-center gap-1.5 overscroll-contain">
                    {daysArray.map((d) => {
                      const dayCell = row.days[d];
                      const status = dayCell?.status || 'ABSENT';

                      let chipClasses = 'bg-slate-100 text-slate-400 border border-slate-200';
                      let text = '-';

                      if (status === 'PRESENT') {
                        chipClasses = 'bg-emerald-500 text-white font-black shadow-xs';
                        text = 'P';
                      } else if (status === 'OUT_OF_RANGE') {
                        chipClasses = 'bg-amber-500 text-white font-black shadow-xs ring-1 ring-amber-300';
                        text = '!';
                      } else if (status === 'WEEKEND') {
                        chipClasses = 'bg-slate-100 text-slate-400 font-medium';
                        text = 'W';
                      } else if (status === 'ABSENT') {
                        chipClasses = 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white';
                        text = 'A';
                      }

                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            setAuditTarget({
                              employee: row.employee,
                              dayRecord: dayCell,
                            })
                          }
                          title={`Day ${d} (${monthNames[selectedMonth - 1]} ${d}): ${status} - Tap to audit`}
                          className="shrink-0 flex flex-col items-center justify-center w-8 h-12 rounded-xl text-xs font-mono transition-transform hover:scale-105 active:scale-95 bg-slate-50 border border-slate-200 hover:border-blue-400"
                        >
                          <span className="text-[9px] font-bold text-slate-500">{d}</span>
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] mt-0.5 ${chipClasses}`}>
                            {text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 2: Wide Grid Matrix Table */}
      {viewMode === 'GRID' && (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-50 min-w-[200px] border-r border-slate-200">
                    Worker Information
                  </th>
                  <th className="py-3 px-2 text-center min-w-[45px] text-emerald-700">Pres</th>
                  <th className="py-3 px-2 text-center min-w-[45px] text-amber-700">Flags</th>
                  <th className="py-3 px-2 text-center min-w-[45px] text-rose-700 border-r border-slate-200">Abs</th>

                  {/* Day Columns 1 to N */}
                  {daysArray.map((d) => (
                    <th
                      key={d}
                      className="py-3 px-1 text-center min-w-[34px] border-r border-slate-200/60"
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 4}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No workers found in timesheet for this project.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row) => (
                    <tr
                      key={row.employee.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Fixed Worker Info Cell */}
                      <td className="py-2.5 px-4 sticky left-0 z-10 bg-white border-r border-slate-200 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.employee.reference_photo_url || DEFAULT_AVATAR}
                            alt={row.employee.full_name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {row.employee.full_name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              {row.employee.iqama_number}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Summary Totals */}
                      <td className="py-2 px-1 text-center font-bold text-emerald-700 bg-emerald-50/50">
                        {row.totalPresent}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-amber-700 bg-amber-50/50">
                        {row.totalViolations}
                      </td>
                      <td className="py-2 px-1 text-center font-bold text-rose-700 bg-rose-50/50 border-r border-slate-200">
                        {row.totalAbsent}
                      </td>

                      {/* Daily Status Chips (1-31) */}
                      {daysArray.map((d) => {
                        const dayCell = row.days[d];
                        const status = dayCell?.status || 'ABSENT';

                        let chipClasses = 'bg-slate-100 text-slate-400';
                        let text = '-';

                        if (status === 'PRESENT') {
                          chipClasses = 'bg-emerald-500 text-white font-bold shadow-xs';
                          text = 'P';
                        } else if (status === 'OUT_OF_RANGE') {
                          chipClasses = 'bg-amber-500 text-white font-bold shadow-xs ring-1 ring-amber-400';
                          text = '!';
                        } else if (status === 'WEEKEND') {
                          chipClasses = 'bg-slate-100 text-slate-400 font-medium';
                          text = 'W';
                        } else if (status === 'ABSENT') {
                          chipClasses = 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white';
                          text = 'A';
                        }

                        return (
                          <td
                            key={d}
                            className="py-1 px-0.5 text-center border-r border-slate-100"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setAuditTarget({
                                  employee: row.employee,
                                  dayRecord: dayCell,
                                })
                              }
                              title={`Day ${d}: ${status} - Click to audit photo & GPS`}
                              className={`w-6 h-6 rounded-md text-[10px] font-mono transition-transform hover:scale-110 active:scale-95 inline-flex items-center justify-center ${chipClasses}`}
                            >
                              {text}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 font-medium">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Click any day cell chip to trigger the instant <strong>Biometric Audit Modal</strong>.</span>
            </div>
            <span className="font-semibold">Showing {filteredMatrix.length} active workers</span>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {auditTarget && (
        <AuditModal
          isOpen={Boolean(auditTarget)}
          onClose={() => setAuditTarget(null)}
          employee={auditTarget.employee}
          dayRecord={auditTarget.dayRecord}
          project={activeProject}
        />
      )}
    </div>
  );
}
