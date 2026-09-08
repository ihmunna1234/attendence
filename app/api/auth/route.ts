import { NextResponse } from 'next/server';
import { getUsers, getProjects } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { passcode, email, password, action } = body;

    // Handle Passcode / Master Key authentication on the server
    if (action === 'passcode' || passcode) {
      const clean = (passcode || '').trim();
      if (!clean) {
        return NextResponse.json(
          { success: false, error: 'Passcode is required.' },
          { status: 400 }
        );
      }

      // 1. Check Admin Master Key on the server (process.env.ADMIN_MASTER_KEY or process.env.NEXT_PUBLIC_ADMIN_KEY)
      const adminMasterKey = process.env.ADMIN_MASTER_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
      if (adminMasterKey && clean === adminMasterKey.trim()) {
        const users = getUsers();
        const admin = users.find((u) => u.role === 'SUPER_ADMIN') || {
          id: 'usr-admin-01',
          email: 'admin@buildcorp.global',
          role: 'SUPER_ADMIN',
          project_id: null,
          full_name: 'System Administrator',
        };

        return NextResponse.json({
          success: true,
          user: admin,
          role: 'SUPER_ADMIN',
        });
      }

      // 2. Check Project Site Passcode or Project Code
      const projects = getProjects();
      const users = getUsers();

      const matchedProject = projects.find((p) => {
        const codeMatch = p.code.toLowerCase() === clean.toLowerCase();
        const passMatch = p.passcode && p.passcode.trim() === clean;
        return codeMatch || passMatch;
      });

      if (matchedProject) {
        const supervisor = users.find(
          (u) => u.project_id === matchedProject.id && u.role === 'PROJECT_MANAGER'
        ) || {
          id: `usr-sup-${matchedProject.id}`,
          email: `supervisor@${matchedProject.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.site`,
          role: 'PROJECT_MANAGER',
          project_id: matchedProject.id,
          full_name: `${matchedProject.name} Supervisor`,
        };

        return NextResponse.json({
          success: true,
          user: supervisor,
          project: matchedProject,
          role: 'PROJECT_MANAGER',
        });
      }

      // 3. Direct user password match
      const directUser = users.find((u) => u.password && u.password.trim() === clean);
      if (directUser) {
        const prj = directUser.project_id
          ? projects.find((p) => p.id === directUser.project_id)
          : null;
        return NextResponse.json({
          success: true,
          user: directUser,
          project: prj,
          role: directUser.role,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid access key. Please verify your credentials.' },
        { status: 401 }
      );
    }

    // Handle Direct Email & Password authentication
    if (email && password) {
      const users = getUsers();
      const projects = getProjects();
      const normalizedEmail = email.trim().toLowerCase();

      const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      if (user.password && user.password.trim() !== password.trim()) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const activePrj = user.project_id
        ? projects.find((p) => p.id === user.project_id)
        : null;

      return NextResponse.json({
        success: true,
        user,
        project: activePrj,
        role: user.role,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid authentication request.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server authentication failed';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
