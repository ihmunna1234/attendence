export type UserRole = 'SUPER_ADMIN' | 'PROJECT_MANAGER';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';

export type LocationStatus = 'WITHIN_GEOFENCE' | 'OUT_OF_RANGE' | 'LOCATION_DISABLED';

export interface Project {
  id: string;
  name: string;
  code: string;
  target_latitude: number | null;
  target_longitude: number | null;
  geofence_radius_meters: number;
  created_at: string;
  description?: string;
  client_name?: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  project_id: string | null;
  full_name?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  project_id: string;
  full_name: string;
  iqama_number: string;
  iqama_document_url?: string;
  reference_photo_url?: string;
  designation: string;
  mobile_number?: string;
  status: EmployeeStatus;
  created_at: string;
}

export interface AttendanceLog {
  id: string;
  employee_id: string;
  project_id: string;
  timestamp: string;
  type: AttendanceType;
  captured_photo_url: string;
  latitude: number | null;
  longitude: number | null;
  location_status: LocationStatus;
  regular_hours?: number; // Standard 10 hours per day
  overtime_hours?: number; // Additional overtime hours
  notes?: string;
  created_at: string;
  // joined fields for easy rendering
  employee?: Employee;
  project?: Project;
}

export interface GeofenceCheckResult {
  distanceMeters: number;
  status: LocationStatus;
  isWithin: boolean;
  accuracyRadiusMeters?: number;
}

export interface TimesheetDayRecord {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  status: 'PRESENT' | 'ABSENT' | 'OUT_OF_RANGE' | 'WEEKEND';
  checkIn?: AttendanceLog;
  checkOut?: AttendanceLog;
  regularHours?: number;
  overtimeHours?: number;
  totalHours?: number;
}

export interface EmployeeTimesheetRow {
  employee: Employee;
  days: Record<number, TimesheetDayRecord>;
  totalPresent: number;
  totalViolations: number;
  totalAbsent: number;
  totalRegularHours?: number;
  totalOvertimeHours?: number;
  totalHours?: number;
}

export interface KPIMetrics {
  totalActiveProjects: number;
  totalRegisteredWorkers: number;
  todayTurnoutPercentage: number;
  todayPresentCount: number;
  todayViolationsCount: number;
}

export const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z'/%3E%3C/svg%3E";

