import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { data: users, error } = await supabaseServer
      .from('users')
      .select('*')
      .ilike('email', email.trim());

    if (error || !users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    
    if (user.passwordHash !== inputHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Don't send password hash back to client
    const { passwordHash, ...safeUser } = user;

    // Set role cookie in response for server-side auth verification
    const response = NextResponse.json({ success: true, user: safeUser });
    response.cookies.set('portal_role', safeUser.role, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

