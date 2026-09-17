import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';
import { readLocalWorkers, writeLocalWorkers, LocalWorker } from '@/utils/workerStorage';
import { sendWorkerInviteEmail } from '@/utils/emailService';

// GET: Return all active workers with real admission stats
export async function GET() {
  try {
    const [usersResult, admissionsResult] = await Promise.all([
      supabaseServer.from('users').select('*').eq('role', 'WORKER'),
      supabaseServer.from('admissions').select('worker_email, status'),
    ]);

    let workersList: any[] = [];

    if (usersResult.error) {
      if ((usersResult.error as any).code === 'PGRST205') {
        // Fallback to local storage if DB table not yet created
        workersList = readLocalWorkers();
      } else {
        throw usersResult.error;
      }
    } else {
      workersList = usersResult.data || [];
      // If DB has 0 workers, merge local workers
      if (workersList.length === 0) {
        const local = readLocalWorkers();
        if (local.length > 0) workersList = local;
      }
    }

    // Build stats map: worker_email → { total, enrolled }
    const statsMap: Record<string, { total: number; enrolled: number }> = {};
    (admissionsResult.data || []).forEach((row: { worker_email: string; status: string }) => {
      const key = (row.worker_email || '').toLowerCase();
      if (!statsMap[key]) statsMap[key] = { total: 0, enrolled: 0 };
      statsMap[key].total += 1;
      if ((row.status || '').toUpperCase() === 'ENROLLED') {
        statsMap[key].enrolled += 1;
      }
    });

    const workers = workersList.map((u) => {
      const stats = statsMap[(u.email || '').toLowerCase()] || { total: 0, enrolled: 0 };
      const rate = stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        designation: u.designation || 'Admissions Counselor',
        status: 'ACTIVE',
        admissions: stats.total,
        successRate: `${rate}%`,
        created_at: u.created_at,
      };
    });

    return NextResponse.json({ success: true, workers });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workers' }, { status: 500 });
  }
}

function isAdminRequest(req: NextRequest): boolean {
  const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
  return roleCookie === 'ADMIN';
}

// POST: Add a new worker
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { name, email, password, phone, designation } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : '';
    const cleanDesignation = designation ? designation.trim() : 'Admissions Counselor';

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Generate clean monotonic sequential worker ID (e.g. WK-01, WK-02...)
    let maxIndex = 0;
    try {
      const { data: existingWorkers } = await supabaseServer
        .from('users')
        .select('id')
        .ilike('id', 'WK-%');

      if (existingWorkers && existingWorkers.length > 0) {
        for (const w of existingWorkers) {
          const match = w.id.match(/^WK-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIndex) maxIndex = num;
          }
        }
      }
    } catch {
      // ignore query error
    }

    // Also check local workers for maxIndex
    const localWorkers = readLocalWorkers();
    for (const lw of localWorkers) {
      const match = lw.id.match(/^WK-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }
    }

    const newId = `WK-${String(maxIndex + 1).padStart(2, '0')}`;
    
    const newUser: LocalWorker = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      role: 'WORKER',
      passwordHash,
      phone: cleanPhone,
      designation: cleanDesignation,
      created_at: new Date().toISOString(),
      status: 'ACTIVE',
    };

    // 1. Try Supabase Insert
    let dbSuccess = false;
    try {
      const { error } = await supabaseServer
        .from('users')
        .insert([{
          id: newId,
          name: cleanName,
          email: cleanEmail,
          role: 'WORKER',
          passwordHash,
        }]);

      if (error) {
        if (error.code === '23505') { // unique violation
          return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
        }
        if (process.env.NODE_ENV === 'development') console.error('Supabase worker insert error:', error);
      } else {
        dbSuccess = true;
      }
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'development') console.error('Supabase worker insert exception:', dbErr);
    }

    // 2. Dual persistence to local workers file
    const existingIndex = localWorkers.findIndex((w) => w.email === cleanEmail);
    if (existingIndex >= 0) {
      if (!dbSuccess) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      localWorkers[existingIndex] = newUser;
    } else {
      localWorkers.push(newUser);
    }
    writeLocalWorkers(localWorkers);

    // Record audit log for new worker creation
    try {
      await supabaseServer.from('audit_logs').insert([{
        action: `Created new counselor account: ${cleanName} (${newId})`,
        device_info: req.headers.get('user-agent') || 'Admin Dashboard',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      }]);
    } catch {
      // non-blocking audit
    }

    // Send real welcome email in background (non-blocking so UI responds instantly in 50ms)
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    sendWorkerInviteEmail({
      to: cleanEmail,
      workerName: cleanName,
      workerId: newId,
      pin: password,
      designation: cleanDesignation,
      portalUrl: `${origin}/login`,
    }).catch((emailErr) => {
      console.warn('Worker email dispatch warning (non-blocking):', emailErr);
    });

    const safeResponse = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      designation: cleanDesignation,
      status: 'ACTIVE',
      admissions: 0,
      successRate: '0%',
      emailQueued: true,
    };

    return NextResponse.json({ success: true, worker: safeResponse });
  } catch {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}

