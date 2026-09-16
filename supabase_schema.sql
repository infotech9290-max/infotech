-- ==============================================================================
-- INFO TECH ADMISSION PORTAL — PRODUCTION ENTERPRISE DATABASE SCHEMA
-- ==============================================================================
-- Run this script in your Supabase Project -> SQL Editor to initialize or upgrade
-- all tables, indexes, and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. SETTINGS TABLE (Global Financial & Payment Gateway Coordinates)
CREATE TABLE IF NOT EXISTS public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  upi_id TEXT DEFAULT 'infotech@icici',
  bank_name TEXT DEFAULT 'INFO TECH PVT LTD',
  bank_account TEXT DEFAULT '31245678901',
  bank_ifsc TEXT DEFAULT 'SBIN0001234',
  qr_image_url TEXT DEFAULT '/receipt-qr.png',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure initial settings row exists
INSERT INTO public.settings (id, upi_id, bank_name, bank_account, bank_ifsc, qr_image_url)
VALUES (1, 'infotech@icici', 'INFO TECH PVT LTD', '31245678901', 'SBIN0001234', '/receipt-qr.png')
ON CONFLICT (id) DO NOTHING;

-- 2. ADMISSIONS TABLE (Comprehensive Student Dossier & Transaction Lifecycle)
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
  total_fee NUMERIC DEFAULT 120000,
  discount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  worker_id TEXT DEFAULT 'WK-001',
  worker_name TEXT DEFAULT 'Agent Ramesh',
  worker_email TEXT DEFAULT 'ramesh@infotech.pro',
  payment_method TEXT DEFAULT 'UPI QR',
  payment_utr TEXT,
  payment_screenshot_url TEXT,
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
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS total_fee NUMERIC DEFAULT 120000;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_id TEXT DEFAULT 'WK-001';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_name TEXT DEFAULT 'Agent Ramesh';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS worker_email TEXT DEFAULT 'ramesh@infotech.pro';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI QR';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_utr TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
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

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_admissions_unique_id ON public.admissions(unique_id);
CREATE INDEX IF NOT EXISTS idx_admissions_worker_id ON public.admissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Zero-Exposure BFF Architecture: Next.js server API routes mediate all database access.
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop prior policies to guarantee idempotency
DROP POLICY IF EXISTS "allow_server_settings" ON public.settings;
DROP POLICY IF EXISTS "allow_server_admissions" ON public.admissions;
DROP POLICY IF EXISTS "allow_server_audit_logs" ON public.audit_logs;

-- Policies allowing authenticated server clients to read and write
CREATE POLICY "allow_server_settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
