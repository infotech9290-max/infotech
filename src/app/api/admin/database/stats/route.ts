import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let host = 'Not configured';
    let projectRef = 'unknown';

    if (supabaseUrl) {
      try {
        const parsed = new URL(supabaseUrl);
        host = parsed.hostname;
        projectRef = host.split('.')[0];
      } catch {
        // ignore parse error
      }
    }

    // Run parallel count queries on the 4 core tables
    const [admissionsRes, usersRes, settingsRes, auditRes] = await Promise.allSettled([
      supabaseServer.from('admissions').select('*', { count: 'exact', head: true }),
      supabaseServer.from('users').select('*', { count: 'exact', head: true }),
      supabaseServer.from('settings').select('*', { count: 'exact', head: true }),
      supabaseServer.from('audit_logs').select('*', { count: 'exact', head: true }),
    ]);

    const latencyMs = Date.now() - startTime;

    const getCount = (res: PromiseSettledResult<any>) => {
      if (res.status === 'fulfilled' && !res.value.error) {
        return typeof res.value.count === 'number' ? res.value.count : 0;
      }
      return 0;
    };

    const isConnected =
      admissionsRes.status === 'fulfilled' && !admissionsRes.value.error;

    return NextResponse.json({
      success: true,
      status: isConnected ? 'healthy' : 'degraded',
      host,
      projectRef,
      latencyMs,
      counts: {
        admissions: getCount(admissionsRes),
        users: getCount(usersRes),
        settings: getCount(settingsRes),
        audit_logs: getCount(auditRes),
      },
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const message = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: message,
        latencyMs,
        counts: { admissions: 0, users: 0, settings: 0, audit_logs: 0 },
      },
      { status: 500 }
    );
  }
}
