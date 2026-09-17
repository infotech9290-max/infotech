import { NextRequest, NextResponse } from 'next/server';

// Supabase project ref extracted from the URL
const PROJECT_REF = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
  : '';

const SCHEMA_SQL = `
-- Settings Table
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
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS website_name TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS account_name TEXT DEFAULT '';

-- Admissions Table
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
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS dossier_pdf_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Automated Audit Trigger
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

-- Atomic Stored Procedure: Settle Student Balance
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_admissions_unique_id ON public.admissions(unique_id);
CREATE INDEX IF NOT EXISTS idx_admissions_worker_id ON public.admissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_server_settings" ON public.settings;
DROP POLICY IF EXISTS "allow_server_admissions" ON public.admissions;
DROP POLICY IF EXISTS "allow_server_audit_logs" ON public.audit_logs;
CREATE POLICY "allow_server_settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_admissions" ON public.admissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_server_audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'WORKER',
  "passwordHash" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_server_users" ON public.users;
CREATE POLICY "allow_server_users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Default Admin (password: admin)
INSERT INTO public.users (id, name, email, role, "passwordHash")
VALUES ('ADM-01', 'Super Admin', 'infotech9290@gmail.com', 'ADMIN', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')
ON CONFLICT (id) DO UPDATE SET email = 'infotech9290@gmail.com';

-- Enable Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pat = body.pat || process.env.SUPABASE_PAT;

    if (!pat || !pat.startsWith('sbp_')) {
      return NextResponse.json(
        { error: 'Invalid Personal Access Token. It should start with sbp_ (or be set in SUPABASE_PAT env var)' },
        { status: 400 }
      );
    }

    if (!PROJECT_REF) {
      return NextResponse.json(
        { error: 'SUPABASE_URL is not configured in .env.local' },
        { status: 500 }
      );
    }

    // Call Supabase Management API to run SQL
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pat}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Supabase API error: ${errText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully! All tables created.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
