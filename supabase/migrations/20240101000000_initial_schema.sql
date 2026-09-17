-- ==============================================================================
-- ADMISSIONS PORTAL — ENTERPRISE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in Supabase Project -> SQL Editor to initialize or upgrade
-- all tables, indexes, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. SETTINGS TABLE (Global Financial & Platform Configuration)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  upi_id TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_ifsc TEXT DEFAULT '',
  account_name TEXT DEFAULT '',
  qr_image_url TEXT DEFAULT '/receipt-qr.png',
  website_name TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  courses JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure initial settings row exists with clean defaults
INSERT INTO public.settings (id, upi_id, bank_name, bank_account, bank_ifsc, account_name, qr_image_url, website_name, logo_url, courses)
VALUES (1, '', '', '', '', '', '/receipt-qr.png', '', '', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Idempotent column additions
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS website_name TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS account_name TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;

-- 2. ADMISSIONS TABLE (Student Ledger & Dossier)
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  father_name TEXT DEFAULT 'N/A',
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  tenth_school TEXT,
  tenth_marks TEXT,
  tenth_year TEXT,
  twelfth_details TEXT,
  twelfth_year TEXT,
  twelfth_stream TEXT,
  graduation_course TEXT,
  graduation_session TEXT,
  status TEXT DEFAULT 'Action Needed',
  balance_due NUMERIC DEFAULT 0,
  total_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  worker_id TEXT DEFAULT '',
  worker_name TEXT DEFAULT '',
  worker_email TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'UPI QR',
  payment_utr TEXT,
  payment_screenshot_url TEXT,
  dossier_pdf_url TEXT,
  tenth_marksheet_url TEXT,
  twelfth_marksheet_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotent column additions for existing installations
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS father_name TEXT DEFAULT 'N/A';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_school TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_marks TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_year TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_details TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_year TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_stream TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS graduation_course TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS graduation_session TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Action Needed';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS balance_due NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS total_fee NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_id TEXT DEFAULT '';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_name TEXT DEFAULT '';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_email TEXT DEFAULT '';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI QR';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_utr TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS dossier_pdf_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. AUDIT LOGS TABLE (Security Footprints & Verification Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. USERS TABLE (Portal Authentication & RBAC)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'WORKER',
  "passwordHash" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default Super Admin (Email: infotech9290@gmail.com | Password: admin)
INSERT INTO public.users (id, name, email, role, "passwordHash")
VALUES (
  'ADM-01',
  'Super Admin',
  'infotech9290@gmail.com',
  'ADMIN',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
)
ON CONFLICT (email) DO NOTHING;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_admissions_unique_id ON public.admissions (unique_id);
CREATE INDEX IF NOT EXISTS idx_admissions_worker_id ON public.admissions (worker_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions (status);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_server_settings" ON public.settings;
DROP POLICY IF EXISTS "allow_server_admissions" ON public.admissions;
DROP POLICY IF EXISTS "allow_server_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "allow_server_users" ON public.users;

CREATE POLICY "allow_server_settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
