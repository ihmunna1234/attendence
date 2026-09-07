import {
  Project,
  User,
  Employee,
  AttendanceLog,
  KPIMetrics,
  EmployeeTimesheetRow,
  TimesheetDayRecord,
} from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE_LOGS,
} from './seed-data';

const STORAGE_KEYS = {
  PROJECTS: 'geoattend_prod_projects_v1',
  USERS: 'geoattend_prod_users_v1',
  EMPLOYEES: 'geoattend_prod_employees_v1',
  LOGS: 'geoattend_prod_logs_v1',
};

// In-memory fallback for SSR
let memProjects = [...INITIAL_PROJECTS];
let memUsers = [...INITIAL_USERS];
let memEmployees = [...INITIAL_EMPLOYEES];
let memLogs = [...INITIAL_ATTENDANCE_LOGS];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getItem<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.warn(`LocalStorage read failed for ${key}:`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`LocalStorage write failed for ${key}:`, e);
  }
}

/* ==================== PROJECTS ==================== */
export function getProjects(): Project[] {
  if (!isBrowser()) return memProjects;
  return getItem<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
}

export function getProjectById(id: string): Project | undefined {
  return getProjects().find((p) => p.id === id);
}

export function createProject(data: Omit<Project, 'id' | 'created_at'>): Project {
  const newProject: Project = {
    ...data,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prj-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const list = [newProject, ...getProjects()];
  setItem(STORAGE_KEYS.PROJECTS, list);
  memProjects = list;
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): Project {
  const list = getProjects().map((p) => (p.id === id ? { ...p, ...updates } : p));
  setItem(STORAGE_KEYS.PROJECTS, list);
  memProjects = list;
  return list.find((p) => p.id === id)!;
}

/* ==================== USERS & AUTH ==================== */
export function getUsers(): User[] {
  if (!isBrowser()) return memUsers;
  return getItem<User>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function createUser(data: Omit<User, 'id' | 'created_at'>): User {
  const newUser: User = {
    ...data,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  const list = [newUser, ...getUsers()];
  setItem(STORAGE_KEYS.USERS, list);
  memUsers = list;
  return newUser;
}

export function authenticateUser(identifier: string, password?: string): User | null {
  const users = getUsers();
  const normalizedId = identifier.trim().toLowerCase();
  
  // 1. Check exact email match
  let user = users.find((u) => u.email.toLowerCase() === normalizedId);

  // 2. If not found by email, check if identifier is a Project Code or Project ID
  if (!user) {
    const projects = getProjects();
    const matchedProject = projects.find(
      (p) => p.code.toLowerCase() === normalizedId || p.id === identifier.trim()
    );
    if (matchedProject) {
      user = users.find((u) => u.project_id === matchedProject.id && u.role === 'PROJECT_MANAGER');
    }
  }

  if (!user) return null;

  // Validate password
  if (password && user.password && user.password !== password.trim()) {
    return null;
  }

  return user;
}

export function authenticateProjectSupervisor(projectId: string, password?: string): User | null {
  const users = getUsers();
  const supervisor = users.find((u) => u.project_id === projectId && u.role === 'PROJECT_MANAGER');
  if (!supervisor) return null;

  if (password && supervisor.password && supervisor.password !== password.trim()) {
    return null;
  }

  return supervisor;
}

/* ==================== EMPLOYEES ==================== */
export function getEmployees(projectId?: string): Employee[] {
  const all = isBrowser() ? getItem<Employee>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES) : memEmployees;
  if (!projectId || projectId === 'ALL') return all;
  return all.filter((e) => e.project_id === projectId);
}

export function getEmployeeById(id: string): Employee | undefined {
  return getEmployees().find((e) => e.id === id);
}

/**
 * Validates whether an Iqama number already exists within the target project
 */
export function isIqamaDuplicate(
  projectId: string,
  iqamaNumber: string,
  excludeEmployeeId?: string
): boolean {
  const trimmed = iqamaNumber.trim();
  const existing = getEmployees(projectId).some(
    (e) => e.iqama_number.trim() === trimmed && e.id !== excludeEmployeeId
  );
  return existing;
}

export function createEmployee(data: Omit<Employee, 'id' | 'created_at'>): Employee {
  // Validate duplicate iqama in project
  if (isIqamaDuplicate(data.project_id, data.iqama_number)) {
    throw new Error(`An employee with Iqama number ${data.iqama_number} already exists in this project.`);
  }

  const newEmployee: Employee = {
    ...data,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const list = [newEmployee, ...getEmployees()];
  setItem(STORAGE_KEYS.EMPLOYEES, list);
  memEmployees = list;
  return newEmployee;
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee {
  const current = getEmployeeById(id);
  if (!current) throw new Error('Employee not found');

  if (updates.iqama_number && updates.iqama_number !== current.iqama_number) {
    const targetProject = updates.project_id || current.project_id;
    if (isIqamaDuplicate(targetProject, updates.iqama_number, id)) {
      throw new Error(`An employee with Iqama number ${updates.iqama_number} already exists in this project.`);
    }
  }

  const list = getEmployees().map((e) => (e.id === id ? { ...e, ...updates } : e));
  setItem(STORAGE_KEYS.EMPLOYEES, list);
  memEmployees = list;
  return list.find((e) => e.id === id)!;
}

export function deleteEmployee(id: string): void {
  const list = getEmployees().filter((e) => e.id !== id);
  setItem(STORAGE_KEYS.EMPLOYEES, list);
  memEmployees = list;
}

/* ==================== ATTENDANCE LOGS ==================== */
export function getAttendanceLogs(filter?: {
  projectId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
}): AttendanceLog[] {
  let list = isBrowser() ? getItem<AttendanceLog>(STORAGE_KEYS.LOGS, INITIAL_ATTENDANCE_LOGS) : memLogs;

  const employeesMap = new Map(getEmployees().map((e) => [e.id, e]));
  const projectsMap = new Map(getProjects().map((p) => [p.id, p]));

  // Populate joined entities
  list = list.map((log) => ({
    ...log,
    employee: employeesMap.get(log.employee_id),
    project: projectsMap.get(log.project_id),
  }));

  if (filter?.projectId && filter.projectId !== 'ALL') {
    list = list.filter((l) => l.project_id === filter.projectId);
  }

  if (filter?.employeeId && filter.employeeId !== 'ALL') {
    list = list.filter((l) => l.employee_id === filter.employeeId);
  }

  if (filter?.startDate) {
    list = list.filter((l) => new Date(l.timestamp) >= new Date(filter.startDate!));
  }

  if (filter?.endDate) {
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    list = list.filter((l) => new Date(l.timestamp) <= end);
  }

  // Sort descending by timestamp
  return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function createAttendanceLog(
  data: Omit<AttendanceLog, 'id' | 'created_at'>
): AttendanceLog {
  const newLog: AttendanceLog = {
    ...data,
    regular_hours: data.regular_hours ?? 10,
    overtime_hours: data.overtime_hours ?? 0,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `att-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const list = [newLog, ...getAttendanceLogs()];
  setItem(STORAGE_KEYS.LOGS, list);
  memLogs = list;
  return newLog;
}

export function updateAttendanceOvertime(
  logId: string,
  overtimeHours: number,
  notes?: string
): AttendanceLog | null {
  const allLogs = getAttendanceLogs();
  const log = allLogs.find((l) => l.id === logId);
  if (!log) return null;

  log.overtime_hours = Math.max(0, overtimeHours);
  if (notes !== undefined) {
    log.notes = notes;
  }

  setItem(STORAGE_KEYS.LOGS, allLogs);
  memLogs = allLogs;
  return log;
}

/* ==================== KPI METRICS ==================== */
export function getKPIMetrics(projectId?: string): KPIMetrics {
  const allProjects = getProjects();
  const activeProjects = allProjects.filter((p) => p.geofence_radius_meters > 0);
  const employees = getEmployees(projectId);
  const totalEmployees = employees.length;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const todayLogs = getAttendanceLogs({
    projectId,
    startDate: startOfDay,
  });

  const presentEmployeeIds = new Set<string>();
  let violations = 0;

  todayLogs.forEach((log) => {
    if (log.type === 'CHECK_IN') {
      presentEmployeeIds.add(log.employee_id);
    }
    if (log.location_status === 'OUT_OF_RANGE') {
      violations += 1;
    }
  });

  const presentCount = presentEmployeeIds.size;
  const turnout = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  return {
    totalActiveProjects: activeProjects.length,
    totalRegisteredWorkers: totalEmployees,
    todayTurnoutPercentage: turnout,
    todayPresentCount: presentCount,
    todayViolationsCount: violations,
  };
}

/* ==================== MONTHLY TIMESHEET MATRIX ==================== */
export function getMonthlyTimesheetMatrix(
  projectId: string,
  year: number,
  month: number // 1-12
): EmployeeTimesheetRow[] {
  const employees = getEmployees(projectId).filter((e) => e.status === 'ACTIVE');
  const daysInMonth = new Date(year, month, 0).getDate();

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
  const endDate = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59)).toISOString();

  const logs = getAttendanceLogs({
    projectId,
    startDate,
    endDate,
  });

  return employees.map((employee) => {
    const days: Record<number, TimesheetDayRecord> = {};
    let totalPresent = 0;
    let totalViolations = 0;
    let totalAbsent = 0;
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(year, month - 1, day);
      const isWeekend = dayDate.getDay() === 5; // Friday weekend

      // Find logs for this employee on this day
      const dayLogs = logs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          log.employee_id === employee.id &&
          logDate.getFullYear() === year &&
          logDate.getMonth() === month - 1 &&
          logDate.getDate() === day
        );
      });

      const checkIn = dayLogs.find((l) => l.type === 'CHECK_IN');
      const checkOut = dayLogs.find((l) => l.type === 'CHECK_OUT');

      let status: 'PRESENT' | 'ABSENT' | 'OUT_OF_RANGE' | 'WEEKEND' = 'ABSENT';
      let regularHours = 0;
      let overtimeHours = 0;
      let totalDayHours = 0;

      if (checkIn) {
        if (checkIn.location_status === 'OUT_OF_RANGE' || checkOut?.location_status === 'OUT_OF_RANGE') {
          status = 'OUT_OF_RANGE';
          totalViolations += 1;
          totalPresent += 1;
        } else {
          status = 'PRESENT';
          totalPresent += 1;
        }

        regularHours = checkIn.regular_hours ?? 10;
        overtimeHours = checkIn.overtime_hours ?? 0;
        totalDayHours = regularHours + overtimeHours;
        totalRegularHours += regularHours;
        totalOvertimeHours += overtimeHours;
      } else if (isWeekend) {
        status = 'WEEKEND';
      } else {
        totalAbsent += 1;
      }

      days[day] = {
        date: dateStr,
        dayNumber: day,
        status,
        checkIn,
        checkOut,
        regularHours,
        overtimeHours,
        totalHours: totalDayHours,
      };
    }

    return {
      employee,
      days,
      totalPresent,
      totalViolations,
      totalAbsent,
      totalRegularHours,
      totalOvertimeHours,
      totalHours: totalRegularHours + totalOvertimeHours,
    };
  });
}

/* ==================== RESET DATABASE ==================== */
export function resetToDemoData(): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_ATTENDANCE_LOGS));
}
