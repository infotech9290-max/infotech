import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';

// GET: Return all active workers with real admission stats
export async function GET() {
  try {
    const [usersResult, admissionsResult] = await Promise.all([
      supabaseServer.from('users').select('*').eq('role', 'WORKER'),
      supabaseServer.from('admissions').select('worker_email, status'),
    ]);

    if (usersResult.error) {
      if ((usersResult.error as any).code === 'PGRST205') {
        return NextResponse.json({ success: true, workers: [] });
      }
      throw usersResult.error;
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

    const workers = (usersResult.data || []).map((u) => {
      const stats = statsMap[(u.email || '').toLowerCase()] || { total: 0, enrolled: 0 };
      const rate = stats.total > 0 ? Math.round((stats.enrolled / stats.total) * 100) : 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        status: 'ACTIVE',
        admissions: stats.total,
        successRate: `${rate}%`,
        created_at: u.created_at,
      };
    });

    return NextResponse.json({ success: true, workers });
  } catch (err) {
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
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Generate clean sequential worker ID (e.g. WK-01, WK-02...)
    const { count } = await supabaseServer
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'WORKER');

    const nextIndex = (count || 0) + 1;
    let candidateId = `WK-${String(nextIndex).padStart(2, '0')}`;

    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', candidateId)
      .maybeSingle();

    if (existingUser) {
      candidateId = `WK-${Math.floor(10 + Math.random() * 90)}`;
    }
    const newId = candidateId;
    
    const newUser = {
      id: newId,
      name,
      email,
      role: 'WORKER',
      passwordHash
    };

    const { error } = await supabaseServer
      .from('users')
      .insert([newUser]);

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
      throw error;
    }

    const safeResponse = {
      id: newId,
      name,
      email,
      status: 'ACTIVE',
      admissions: 0,
      successRate: '0%'
    };

    return NextResponse.json({ success: true, worker: safeResponse });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create worker' }, { status: 500 });
  }
}

