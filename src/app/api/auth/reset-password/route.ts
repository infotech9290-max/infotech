import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await req.json();

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Email, current password, and new password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data: users, error: fetchErr } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', cleanEmail);

    if (fetchErr || !users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const currentInputHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    
    if (user.passwordHash !== currentInputHash) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    const { error: updateErr } = await supabaseServer
      .from('users')
      .update({ passwordHash: newHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!updateErr) {
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to save new password' }, { status: 500 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

