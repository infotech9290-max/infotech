import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload || !payload.data) {
      return NextResponse.json(
        { error: 'Invalid backup file format. Expected structured JSON backup.' },
        { status: 400 }
      );
    }

    const { settings = [], users = [], admissions = [], audit_logs = [] } = payload.data;

    const stats = {
      settings: 0,
      users: 0,
      admissions: 0,
      audit_logs: 0,
    };

    // 1. Restore Settings
    if (Array.isArray(settings) && settings.length > 0) {
      for (const item of settings) {
        const { error } = await supabaseServer
          .from('settings')
          .upsert(item, { onConflict: 'id' });
        if (!error) stats.settings++;
      }
    }

    // 2. Restore Users (Workers & Admin)
    if (Array.isArray(users) && users.length > 0) {
      for (const u of users) {
        const { error } = await supabaseServer
          .from('users')
          .upsert(u, { onConflict: 'id' });
        if (!error) stats.users++;
      }
    }

    // 3. Restore Admissions (Students)
    if (Array.isArray(admissions) && admissions.length > 0) {
      // Batch in chunks of 50
      for (let i = 0; i < admissions.length; i += 50) {
        const chunk = admissions.slice(i, i + 50);
        const { error } = await supabaseServer
          .from('admissions')
          .upsert(chunk, { onConflict: 'unique_id' });
        if (!error) {
          stats.admissions += chunk.length;
        } else {
          // Fallback to item-by-item if a row has a conflict issue
          for (const s of chunk) {
            const { error: singleErr } = await supabaseServer
              .from('admissions')
              .upsert(s, { onConflict: 'unique_id' });
            if (!singleErr) stats.admissions++;
          }
        }
      }
    }

    // 4. Restore Audit Logs
    if (Array.isArray(audit_logs) && audit_logs.length > 0) {
      for (let i = 0; i < audit_logs.length; i += 50) {
        const chunk = audit_logs.slice(i, i + 50);
        const { error } = await supabaseServer
          .from('audit_logs')
          .upsert(chunk, { onConflict: 'id' });
        if (!error) stats.audit_logs += chunk.length;
      }
    }

    // Log the restore event
    try {
      await supabaseServer.from('audit_logs').insert({
        action: 'DATABASE_RESTORE_COMPLETED',
        actor_role: 'ADMIN',
        actor_email: 'infotech9290@gmail.com',
        details: JSON.stringify(stats),
      });
    } catch {
      // ignore logging error
    }

    return NextResponse.json({
      success: true,
      message: 'Database backup restored successfully into current Supabase!',
      restored: stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to restore database';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
