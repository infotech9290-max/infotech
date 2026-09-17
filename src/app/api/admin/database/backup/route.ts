import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let host = 'localhost';
    try {
      if (supabaseUrl) host = new URL(supabaseUrl).hostname;
    } catch {
      // ignore
    }

    // Fetch all real records from all 4 tables
    const [settingsRes, usersRes, admissionsRes, auditRes] = await Promise.all([
      supabaseServer.from('settings').select('*'),
      supabaseServer.from('users').select('*'),
      supabaseServer.from('admissions').select('*').order('created_at', { ascending: false }),
      supabaseServer.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(1000),
    ]);

    const settings = settingsRes.data || [];
    const users = usersRes.data || [];
    const admissions = admissionsRes.data || [];
    const audit_logs = auditRes.data || [];

    const backupPayload = {
      meta: {
        application: 'Infotech Admissions Portal',
        version: '2.0-enterprise',
        exportedAt: new Date().toISOString(),
        sourceHost: host,
        recordCounts: {
          settings: settings.length,
          users: users.length,
          admissions: admissions.length,
          audit_logs: audit_logs.length,
        },
      },
      data: {
        settings,
        users,
        admissions,
        audit_logs,
      },
    };

    return NextResponse.json(backupPayload, {
      headers: {
        'Content-Disposition': `attachment; filename="infotech_db_backup_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate backup';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
