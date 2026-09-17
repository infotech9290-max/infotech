import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { readLocalWorkers } from '@/utils/workerStorage';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user: any = null;

    try {
      const { data: users, error } = await supabaseServer
        .from('users')
        .select('*')
        .eq('email', cleanEmail);

      if (!error && users && users.length > 0) {
        user = users[0];
      }
    } catch {
      // Supabase uninitialized or connection error
    }

    // Fallback if users table is uninitialized or user not in Supabase yet
    if (!user) {
      if (cleanEmail === 'info@admin.com') {
        user = {
          id: 'ADM-01',
          name: 'Super Admin',
          email: 'info@admin.com',
          role: 'ADMIN',
          passwordHash: crypto.createHash('sha256').update('admin').digest('hex'),
        };
      } else {
        const localWorkers = readLocalWorkers();
        user = localWorkers.find((w) => w.email.toLowerCase() === cleanEmail);
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Constant-time comparison to protect against timing attacks
    const userHashBuffer = Buffer.from(user.passwordHash || '', 'utf8');
    const inputHashBuffer = Buffer.from(inputHash, 'utf8');
    const isValidPassword = 
      userHashBuffer.length === inputHashBuffer.length && 
      crypto.timingSafeEqual(userHashBuffer, inputHashBuffer);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Don't send password hash back to client
    const { passwordHash, ...safeUser } = user;

    // Record audit log for successful login
    try {
      await supabaseServer.from('audit_logs').insert([{
        admin_id: safeUser.id,
        action: `User logged in: ${safeUser.name || safeUser.email} (${safeUser.role})`,
        device_info: req.headers.get('user-agent') || 'Web Browser',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      }]);
    } catch {
      // Non-blocking if audit table uninitialized
    }

    // Set role cookie in response for server-side auth verification
    const response = NextResponse.json({ success: true, user: safeUser });
    response.cookies.set('portal_role', safeUser.role, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    const message = err?.message || (err instanceof Error ? err.message : 'Internal error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

