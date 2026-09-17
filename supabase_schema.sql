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
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'Standard Course';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS installments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
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

-- Seed default Super Admin (Email: info@admin.com | Password: admin)
INSERT INTO public.users (id, name, email, role, "passwordHash")
VALUES (
  'ADM-01',
  'Super Admin',
  'info@admin.com',
  'ADMIN',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
)
ON CONFLICT (email) DO NOTHING;

-- 5. AUTOMATED STATUS AUDIT TRIGGER
CREATE OR REPLACE FUNCTION public.audit_admission_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.audit_logs (action, device_info, ip_address)
    VALUES (
      'Admission #' || NEW.unique_id || ' status changed: ' || OLD.status || ' -> ' || NEW.status,
      'PostgreSQL Database Trigger',
      '127.0.0.1'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_admission_status ON public.admissions;
CREATE TRIGGER trg_audit_admission_status
AFTER UPDATE ON public.admissions
FOR EACH ROW EXECUTE FUNCTION public.audit_admission_changes();

-- 6. ATOMIC STORED PROCEDURE (RPC): SETTLE STUDENT BALANCE
CREATE OR REPLACE FUNCTION public.settle_student_balance(
  p_identifier TEXT,
  p_utr TEXT DEFAULT 'MANUAL-SETTLE',
  p_payment_mode TEXT DEFAULT 'Cash'
)
RETURNS JSONB AS $$
DECLARE
  v_admission RECORD;
  v_new_paid NUMERIC;
BEGIN
  SELECT * INTO v_admission FROM public.admissions 
  WHERE unique_id = p_identifier OR id::text = p_identifier
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Student record not found for: ' || p_identifier);
  END IF;

  v_new_paid := v_admission.total_fee - v_admission.discount;

  UPDATE public.admissions
  SET 
    paid_amount = v_new_paid,
    balance_due = 0,
    status = 'Enrolled',
    payment_utr = COALESCE(p_utr, v_admission.payment_utr, 'CASH-SETTLED'),
    updated_at = timezone('utc'::text, now())
  WHERE id = v_admission.id;

  INSERT INTO public.audit_logs (action, device_info, ip_address)
  VALUES (
    'Balance settled in full for student: ' || v_admission.student_name || ' (#' || v_admission.unique_id || ') via ' || p_payment_mode,
    'RPC Procedure',
    '127.0.0.1'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Balance settled and student marked Enrolled',
    'unique_id', v_admission.unique_id,
    'paid_amount', v_new_paid
  );
END;
$$ LANGUAGE plpgsql;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_admissions_unique_id ON public.admissions (unique_id);
CREATE INDEX IF NOT EXISTS idx_admissions_worker_id ON public.admissions (worker_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions (status);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
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

-- 9. ENABLE REALTIME WEBSOCKET PUBLICATIONS
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admissions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

