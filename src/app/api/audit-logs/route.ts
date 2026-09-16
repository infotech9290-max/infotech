import { NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { getLocalAuditLogs } from '@/utils/localStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      const { data, error } = await supabaseServer
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return NextResponse.json({ data });
      }
    } catch (dbErr) {
      console.warn('Supabase audit logs query skipped, using resilient store:', dbErr);
    }

    const localLogs = await getLocalAuditLogs();
    return NextResponse.json({ data: localLogs });
  } catch (_err) {
    const localLogs = await getLocalAuditLogs();
    return NextResponse.json({ data: localLogs });
  }
}
