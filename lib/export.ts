import * as XLSX from 'xlsx';
import { AttendanceLog, EmployeeTimesheetRow } from './types';
import { formatDistance } from './geofence';

/**
 * Generates and triggers download of an Excel (.xlsx) file of Attendance Logs
 */
export function exportAttendanceLogsToExcel(logs: AttendanceLog[], projectName: string = 'All_Projects'): void {
  const rows = logs.map((log, index) => {
    const dateObj = new Date(log.timestamp);
    return {
      'Sl No': index + 1,
      'Project Name': log.project?.name || log.project_id,
      'Project Code': log.project?.code || 'N/A',
      'Employee Name': log.employee?.full_name || 'Unknown',
      'Iqama Number': log.employee?.iqama_number || 'N/A',
      'Designation': log.employee?.designation || 'N/A',
      'Log Type': log.type,
      'Date': dateObj.toLocaleDateString(),
      'Time (Local)': dateObj.toLocaleTimeString(),
      'Latitude': log.latitude ?? 'N/A',
      'Longitude': log.longitude ?? 'N/A',
      'Geofence Compliance': log.location_status,
      'Photo URL': log.captured_photo_url ? 'Captured' : 'None',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Logs');

  // Auto-size columns
  const maxWidths = [10, 30, 15, 25, 15, 25, 12, 12, 12, 12, 12, 20, 10];
  worksheet['!cols'] = maxWidths.map((w) => ({ wch: w }));

  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Attendance_Report_${sanitized}_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and triggers download of a Monthly Timesheet Payroll Matrix (.xlsx)
 */
export function exportTimesheetMatrixToExcel(
  matrix: EmployeeTimesheetRow[],
  projectName: string,
  year: number,
  month: number
): void {
  const daysInMonth = new Date(year, month, 0).getDate();

  const rows = matrix.map((row, index) => {
    const base: Record<string, string | number> = {
      'Sl No': index + 1,
      'Employee Name': row.employee.full_name,
      'Iqama Number': row.employee.iqama_number,
      'Designation': row.employee.designation,
      'Total Days Present': row.totalPresent,
      'Regular Hours (10h)': row.totalRegularHours ?? (row.totalPresent * 10),
      'Overtime Hours': row.totalOvertimeHours ?? 0,
      'Total Hours': row.totalHours ?? ((row.totalRegularHours ?? (row.totalPresent * 10)) + (row.totalOvertimeHours ?? 0)),
      'Geofence Violations': row.totalViolations,
      'Absent Days': row.totalAbsent,
    };

    // Add days 1 to N
    for (let d = 1; d <= daysInMonth; d++) {
      const cell = row.days[d];
      let val = '-';
      if (cell.status === 'PRESENT') val = 'P';
      else if (cell.status === 'OUT_OF_RANGE') val = 'P (OOR)';
      else if (cell.status === 'WEEKEND') val = 'OFF';
      else if (cell.status === 'ABSENT') val = 'A';
      base[`Day ${d}`] = val;
    }

    return base;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Payroll');

  const sanitized = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Timesheet_Payroll_${sanitized}_${year}_${String(month).padStart(2, '0')}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Generates and triggers download of CSV formatted attendance data
 */
export function exportAttendanceLogsToCSV(logs: AttendanceLog[], projectName: string = 'All_Projects'): void {
  const headers = [
    'Sl No',
    'Project Name',
    'Project Code',
    'Employee Name',
    'Iqama Number',
    'Designation',
    'Log Type',
    'Date',
    'Time',
    'Latitude',
    'Longitude',
    'Geofence Status'
  ];

  const lines = logs.map((log, index) => {
    const d = new Date(log.timestamp);
    return [
      index + 1,
      `"${(log.project?.name || log.project_id).replace(/"/g, '""')}"`,
      `"${(log.project?.code || '').replace(/"/g, '""')}"`,
      `"${(log.employee?.full_name || '').replace(/"/g, '""')}"`,
      `"${log.employee?.iqama_number || ''}"`,
      `"${(log.employee?.designation || '').replace(/"/g, '""')}"`,
      log.type,
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      log.latitude ?? '',
      log.longitude ?? '',
      log.location_status,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...lines].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Attendance_Report_${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
