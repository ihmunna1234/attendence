-- ==============================================================================
-- PHOTO & GEOLOCATION ATTENDANCE MANAGEMENT SYSTEM
-- PostgreSQL / Supabase Schema Definition
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Enum Types
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

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    target_latitude NUMERIC(10, 7),
    target_longitude NUMERIC(10, 7),
    geofence_radius_meters INTEGER NOT NULL DEFAULT 200,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table (Linked with Supabase Auth or standalone app users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'PROJECT_MANAGER',
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Employees Table
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

-- 5. Attendance Logs Table
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_employees_project_id ON employees(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_iqama ON employees(iqama_number);
CREATE INDEX IF NOT EXISTS idx_attendance_project_date ON attendance_logs(project_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_logs(timestamp DESC);

-- 7. Supabase Storage Buckets (Run in Supabase Storage setup or SQL Editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('iqama-documents', 'iqama-documents', true),
    ('reference-photos', 'reference-photos', true),
    ('attendance-snapshots', 'attendance-snapshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Allow authenticated and public read/write for these buckets in prototype
CREATE POLICY "Public Read Iqama" ON storage.objects FOR SELECT USING (bucket_id = 'iqama-documents');
CREATE POLICY "Public Upload Iqama" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'iqama-documents');

CREATE POLICY "Public Read Reference Photos" ON storage.objects FOR SELECT USING (bucket_id = 'reference-photos');
CREATE POLICY "Public Upload Reference Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reference-photos');

CREATE POLICY "Public Read Attendance Snapshots" ON storage.objects FOR SELECT USING (bucket_id = 'attendance-snapshots');
CREATE POLICY "Public Upload Attendance Snapshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attendance-snapshots');

-- 8. Seed Initial Default Data (Demo Projects)
INSERT INTO projects (id, name, code, target_latitude, target_longitude, geofence_radius_meters)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Red Sea Coastal Expressway - Sector 4', 'PRJ-RSC-04', 24.7135520, 46.6752960, 250),
    ('22222222-2222-2222-2222-222222222222', 'Riyadh Metro Line 3 Extension Hub', 'PRJ-RML-03', 24.7742650, 46.7385860, 200),
    ('33333333-3333-3333-3333-333333333333', 'NEOM Gateway Commercial Tower', 'PRJ-NEO-01', 28.0058700, 35.2104500, 300)
ON CONFLICT (id) DO NOTHING;
