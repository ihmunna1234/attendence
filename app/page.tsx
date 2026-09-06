'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { SuperAdminDashboard } from '@/components/admin/super-admin-dashboard';
import { ProjectManagerDashboard } from '@/components/admin/project-manager-dashboard';

export default function HomePage() {
  const { role } = useAuth();

  return (
    <div>
      {role === 'SUPER_ADMIN' ? (
        <SuperAdminDashboard />
      ) : (
        <ProjectManagerDashboard />
      )}
    </div>
  );
}
