'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Project, UserRole } from './types';
import {
  getProjects,
  getUsers,
  authenticateUser,
  authenticateProjectSupervisor,
  authenticateByPasscode,
  resetToDemoData,
} from './db';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  activeProject: Project | null;
  projects: Project[];
  allUsers: User[];
  login: (emailOrCode: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithProject: (projectId: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPasscode: (passcode: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  loginAsPreset: (userId: string) => void;
  logout: () => void;
  setActiveProject: (project: Project | null) => void;
  refreshProjects: () => void;
  resetAllDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'pg_authenticated_user_id_v2';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshProjects = useCallback(() => {
    const prjs = getProjects();
    const usrs = getUsers();
    setProjects(prjs);
    setAllUsers(usrs);

    if (activeProject) {
      const updated = prjs.find((p) => p.id === activeProject.id);
      if (updated) setActiveProject(updated);
    }
  }, [activeProject]);

  useEffect(() => {
    const prjs = getProjects();
    const usrs = getUsers();
    setProjects(prjs);
    setAllUsers(usrs);

    // Check if user was previously logged in
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    if (savedUserId) {
      const foundUser = usrs.find((u) => u.id === savedUserId);
      if (foundUser) {
        setUser(foundUser);
        if (foundUser.role === 'PROJECT_MANAGER' && foundUser.project_id) {
          const p = prjs.find((x) => x.id === foundUser.project_id);
          setActiveProject(p || prjs[0] || null);
        } else {
          setActiveProject(prjs[0] || null);
        }
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const authenticated = authenticateUser(email, password);
    if (!authenticated) {
      return { success: false, error: 'Invalid credentials. Please verify your email and password.' };
    }

    setUser(authenticated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, authenticated.id);
    }

    const prjs = getProjects();
    if (authenticated.role === 'PROJECT_MANAGER' && authenticated.project_id) {
      const p = prjs.find((x) => x.id === authenticated.project_id);
      setActiveProject(p || prjs[0] || null);
    } else {
      setActiveProject(prjs[0] || null);
    }

    return { success: true };
  };

  const loginWithProject = async (projectId: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const authenticated = authenticateProjectSupervisor(projectId, password);
    if (!authenticated) {
      return { success: false, error: 'Invalid supervisor password for this project site.' };
    }

    setUser(authenticated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, authenticated.id);
    }

    const prjs = getProjects();
    const p = prjs.find((x) => x.id === projectId);
    setActiveProject(p || prjs[0] || null);

    return { success: true };
  };

  const loginWithPasscode = async (passcode: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, action: 'passcode' }),
      });

      const data = await response.json();
      if (!data.success || !data.user) {
        return { success: false, error: data.error || 'Invalid access passcode.' };
      }

      setUser(data.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, data.user.id);
      }

      const prjs = getProjects();
      if (data.project) {
        setActiveProject(data.project);
      } else if (data.user.role === 'PROJECT_MANAGER' && data.user.project_id) {
        const p = prjs.find((x) => x.id === data.user.project_id);
        setActiveProject(p || prjs[0] || null);
      } else {
        setActiveProject(prjs[0] || null);
      }

      return { success: true, role: data.user.role };
    } catch {
      return { success: false, error: 'Server authentication failed. Please try again.' };
    }
  };

  const loginAsPreset = (userId: string) => {
    const usrs = getUsers();
    const target = usrs.find((u) => u.id === userId);
    if (!target) return;

    setUser(target);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, target.id);
    }

    const prjs = getProjects();
    if (target.role === 'PROJECT_MANAGER' && target.project_id) {
      const p = prjs.find((x) => x.id === target.project_id);
      setActiveProject(p || prjs[0] || null);
    } else {
      setActiveProject(prjs[0] || null);
    }
  };

  const logout = () => {
    setUser(null);
    setActiveProject(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const handleSetActiveProject = (project: Project | null) => {
    // If project supervisor, prevent unauthorized project switching
    if (user?.role === 'PROJECT_MANAGER' && user.project_id) {
      const authorizedProject = projects.find((p) => p.id === user.project_id);
      setActiveProject(authorizedProject || null);
      return;
    }
    // Super admin can freely switch
    setActiveProject(project);
  };

  const resetAllDemoData = () => {
    resetToDemoData();
    refreshProjects();
    logout();
    window.location.reload();
  };

  if (!isInitialized) {
    return null; // Brief hydration delay
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'SUPER_ADMIN',
        isAuthenticated: Boolean(user),
        activeProject,
        projects,
        allUsers,
        login,
        loginWithProject,
        loginWithPasscode,
        loginAsPreset,
        logout,
        setActiveProject: handleSetActiveProject,
        refreshProjects,
        resetAllDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
