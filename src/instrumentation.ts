/**
 * Next.js Instrumentation — Auto Database Migration
 * Runs ONCE on every server startup (local dev + Vercel + Netlify).
 * Set SUPABASE_PAT in your deployment env vars and never touch SQL Editor again.
 *
 * How to get SUPABASE_PAT:
 * supabase.com → Account (top-right avatar) → Access Tokens → Generate New Token
 */

export async function register() {
  // Only run on Node.js runtime (not Edge), and only on server side
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const pat = process.env.SUPABASE_PAT;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!pat || !supabaseUrl) {
    // Silently skip — no PAT means user will use manual SQL Editor setup
    return;
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    const SCHEMA_SQL = `
-- ============================================================
-- AUTO-MIGRATION — Runs on every deployment. Safe to re-run.
-- ============================================================

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
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS account_name TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unique_id TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  father_name TEXT DEFAULT 'N/A',
  email TEXT, phone TEXT,
  photo_url TEXT, dossier_pdf_url TEXT,
  tenth_school TEXT, tenth_marks TEXT, tenth_year TEXT, tenth_marksheet_url TEXT,
  twelfth_details TEXT, twelfth_year TEXT, twelfth_stream TEXT, twelfth_marksheet_url TEXT,
  graduation_course TEXT, graduation_session TEXT,
  status TEXT DEFAULT 'Action Needed',
  balance_due NUMERIC DEFAULT 0, total_fee NUMERIC DEFAULT 120000,
  discount NUMERIC DEFAULT 0, paid_amount NUMERIC DEFAULT 0,
  worker_id TEXT, worker_name TEXT, worker_email TEXT,
  payment_method TEXT DEFAULT 'UPI QR', payment_utr TEXT, payment_screenshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS father_name TEXT DEFAULT 'N/A';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS dossier_pdf_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS tenth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_marksheet_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_year TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS twelfth_stream TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT, action TEXT NOT NULL,
  device_info TEXT, ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'WORKER',
  "passwordHash" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admissions_unique_id ON public.admissions(unique_id);
CREATE INDEX IF NOT EXISTS idx_admissions_worker_id ON public.admissions(worker_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON public.admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_created_at ON public.admissions(created_at DESC);

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

-- Default Admin (password = 'admin')
INSERT INTO public.users (id, name, email, role, "passwordHash")
VALUES ('ADM-01', 'Super Admin', 'infotech9290@gmail.com', 'ADMIN',
        '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')
ON CONFLICT (id) DO UPDATE SET email = 'infotech9290@gmail.com';
`;

    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pat}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      }
    );

    if (res.ok) {
      console.log('✅ [AutoMigration] Database schema applied successfully.');
    } else {
      const err = await res.text();
      console.warn('⚠️ [AutoMigration] Schema apply warning:', err);
    }
  } catch (e) {
    // Non-fatal — app still works, just log the warning
    console.warn('⚠️ [AutoMigration] Skipped:', e instanceof Error ? e.message : e);
  }
}
