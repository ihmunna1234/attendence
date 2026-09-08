import { Project, Employee, AttendanceLog, User } from './types';

// Production clean seed: Empty projects array for real project creation
export const INITIAL_PROJECTS: Project[] = [];

// Production initial Super Admin account for workspace initialization
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-01',
    email: 'admin@buildcorp.global',
    password: process.env.NEXT_PUBLIC_ADMIN_KEY?.trim() || undefined,
    role: 'SUPER_ADMIN',
    project_id: null,
    full_name: 'Administrator',
    created_at: '2026-01-01T00:00:00Z',
  },
];

// Production clean seed: Empty workforce roster
export const INITIAL_EMPLOYEES: Employee[] = [];

// Production clean seed: Empty attendance logs
export const INITIAL_ATTENDANCE_LOGS: AttendanceLog[] = [];
