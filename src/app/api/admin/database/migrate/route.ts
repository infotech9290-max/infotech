import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/utils/supabaseServer';
import { SCHEMA_SQL } from '@/app/api/setup/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { targetUrl, targetKey, pat } = body;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Valid Target Supabase URL is required (e.g. https://xyz.supabase.co)' },
        { status: 400 }
      );
    }

    if (!targetKey || typeof targetKey !== 'string' || targetKey.length < 20) {
      return NextResponse.json(
        { error: 'Valid Target Supabase Anon Key or Service Role Key is required' },
        { status: 400 }
      );
    }

    // Step 1: Extract project ref from targetUrl
    let targetProjectRef = '';
    try {
      targetProjectRef = new URL(targetUrl).hostname.split('.')[0];
    } catch {
      return NextResponse.json({ error: 'Failed to parse Target Supabase URL' }, { status: 400 });
    }

    // Step 2: If PAT is provided, run SCHEMA_SQL on target project first
    if (pat && typeof pat === 'string' && pat.startsWith('sbp_')) {
      try {
        const schemaRes = await fetch(
          `https://api.supabase.com/v1/projects/${targetProjectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${pat.trim()}`,
            },
            body: JSON.stringify({ query: SCHEMA_SQL }),
          }
        );
        if (!schemaRes.ok) {
          const errText = await schemaRes.text();
          console.warn('Target project schema creation warning:', errText);
        }
      } catch (schemaErr) {
        console.warn('Failed to auto-init schema via PAT on target:', schemaErr);
      }
    }

    // Step 3: Initialize client for target Supabase
    const targetClient = createClient(targetUrl.trim(), targetKey.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Step 4: Extract all live data from current Supabase
    const [settingsRes, usersRes, admissionsRes, auditRes] = await Promise.all([
      supabaseServer.from('settings').select('*'),
      supabaseServer.from('users').select('*'),
      supabaseServer.from('admissions').select('*'),
      supabaseServer.from('audit_logs').select('*').limit(2000),
    ]);

    const settingsData = settingsRes.data || [];
    const usersData = usersRes.data || [];
    const admissionsData = admissionsRes.data || [];
    const auditData = auditRes.data || [];

    const transferStats = {
      settings: 0,
      users: 0,
      admissions: 0,
      audit_logs: 0,
    };

    // Step 5: Transfer Settings
    for (const item of settingsData) {
      const { error } = await targetClient.from('settings').upsert(item, { onConflict: 'id' });
      if (!error) transferStats.settings++;
    }

    // Step 6: Transfer Users
    for (const u of usersData) {
      const { error } = await targetClient.from('users').upsert(u, { onConflict: 'id' });
      if (!error) transferStats.users++;
    }

    // Step 7: Transfer Admissions (Students) in chunks of 50
    for (let i = 0; i < admissionsData.length; i += 50) {
      const chunk = admissionsData.slice(i, i + 50);
      const { error } = await targetClient.from('admissions').upsert(chunk, { onConflict: 'unique_id' });
      if (!error) {
        transferStats.admissions += chunk.length;
      } else {
        // Row-by-row fallback
        for (const s of chunk) {
          const { error: sErr } = await targetClient.from('admissions').upsert(s, { onConflict: 'unique_id' });
          if (!sErr) transferStats.admissions++;
        }
      }
    }

    // Step 8: Transfer Audit Logs
    for (let i = 0; i < auditData.length; i += 50) {
      const chunk = auditData.slice(i, i + 50);
      const { error } = await targetClient.from('audit_logs').upsert(chunk, { onConflict: 'id' });
      if (!error) transferStats.audit_logs += chunk.length;
    }

    // Step 9: Log the migration event in current Supabase
    try {
      await supabaseServer.from('audit_logs').insert({
        action: 'DATABASE_MIGRATION_OUTBOUND',
        actor_role: 'ADMIN',
        actor_email: 'infotech9290@gmail.com',
        details: JSON.stringify({
          targetHost: new URL(targetUrl).hostname,
          transferred: transferStats,
        }),
      });
    } catch {
      // ignore
    }

    const envSnippet = `SUPABASE_URL=${targetUrl.trim()}\nSUPABASE_ANON_KEY=${targetKey.trim()}`;

    return NextResponse.json({
      success: true,
      message: `Successfully migrated all live data to target Supabase (${transferStats.admissions} students, ${transferStats.users} users, ${transferStats.settings} settings, ${transferStats.audit_logs} logs)!`,
      transferred: transferStats,
      envSnippet,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database migration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
