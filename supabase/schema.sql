-- ==============================================================================
-- GEOATTEND - PHOTO & GEOLOCATION ATTENDANCE MANAGEMENT SYSTEM
-- Complete PostgreSQL / Supabase Schema Definition
-- Run this entire script in your Supabase SQL Editor: Dashboard > SQL Editor > New query
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom ENUM Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'PROJECT_MANAGER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_type AS ENUM ('CHECK_IN', 'CHECK_OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_status_enum AS ENUM ('WITHIN_GEOFENCE', 'OUT_OF_RANGE', 'LOCATION_DISABLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Projects Table (Sites with GPS Centroids & Geofence Radius)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    client_name TEXT,
    description TEXT,
    target_latitude NUMERIC(10, 7),
    target_longitude NUMERIC(10, 7),
    geofence_radius_meters INTEGER NOT NULL DEFAULT 200,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Users Table (Super Admins and Site Supervisors)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL DEFAULT 'admin123',
    role user_role NOT NULL DEFAULT 'PROJECT_MANAGER',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Employees Table (Registered Workforce)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    iqama_number TEXT NOT NULL,
    iqama_document_url TEXT,
    reference_photo_url TEXT,
    designation TEXT NOT NULL,
    mobile_number TEXT,
    status employee_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_iqama_per_project UNIQUE (project_id, iqama_number)
);

-- 6. Attendance Logs Table (Punches with Photo & Live GPS)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type attendance_type NOT NULL,
    captured_photo_url TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    location_status location_status_enum NOT NULL DEFAULT 'WITHIN_GEOFENCE',
    regular_hours NUMERIC(4, 2) NOT NULL DEFAULT 10.00,
    overtime_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration support for existing databases
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS regular_hours NUMERIC(4, 2) NOT NULL DEFAULT 10.00;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(4, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. High-Performance Query Indexes
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_project_id ON users(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_project_id ON employees(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_iqama ON employees(iqama_number);
CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON attendance_logs(project_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(timestamp DESC);

-- 8. Row Level Security (RLS) - Permissive for Web Application Client
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on users" ON users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on employees" ON employees FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read-write on attendance_logs" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. Storage Buckets (For Iqama Documents, Facial References, Punch Snapshots)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('iqama-documents', 'iqama-documents', true),
    ('reference-photos', 'reference-photos', true),
    ('attendance-snapshots', 'attendance-snapshots', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: Public Read & Upload Access
DO $$ BEGIN
    CREATE POLICY "Public Read Iqama" ON storage.objects FOR SELECT USING (bucket_id = 'iqama-documents');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Upload Iqama" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'iqama-documents');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Reference Photos" ON storage.objects FOR SELECT USING (bucket_id = 'reference-photos');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Upload Reference Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reference-photos');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Read Attendance Snapshots" ON storage.objects FOR SELECT USING (bucket_id = 'attendance-snapshots');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Public Upload Attendance Snapshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendance-snapshots');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 10. Initial Clean Super Admin Account
-- This allows you to log in on first launch and create your real projects.
INSERT INTO users (id, email, password, role, project_id, full_name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@buildcorp.global',
    'admin123',
    'SUPER_ADMIN',
    NULL,
    'System Administrator'
)
ON CONFLICT (email) DO NOTHING;
