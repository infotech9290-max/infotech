import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, recoveryKey, newPassword } = await req.json();

    if (!email || !recoveryKey || !newPassword) {
      return NextResponse.json(
        { error: 'Email, Master Recovery Key, and new password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check Master Recovery Key
    const validKey = process.env.ADMIN_RECOVERY_KEY || 'INFOTECH-9290-MASTER';
    if (recoveryKey.trim() !== validKey) {
      return NextResponse.json(
        { error: 'Invalid Master Recovery Key. Please check the key in .env.local' },
        { status: 401 }
      );
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters long' },
        { status: 400 }
      );
    }

    // Verify user is an ADMIN
    const { data: users, error: fetchErr } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('role', 'ADMIN');

    if (fetchErr || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'No Admin account found with this email address.' },
        { status: 404 }
      );
    }

    const user = users[0];
    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update in Supabase
    const { error: updateErr } = await supabaseServer
      .from('users')
      .update({ passwordHash: newHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateErr) {
      return NextResponse.json(
        { error: `Database error: ${updateErr.message}` },
        { status: 500 }
      );
    }

    // Record Audit Log
    try {
      await supabaseServer.from('audit_logs').insert([{
        action: `Super Admin emergency password reset: ${cleanEmail}`,
        device_info: req.headers.get('user-agent') || 'Admin Recovery Portal',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      }]);
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      message: 'Super Admin password reset successfully! You can now log in with your new password.',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
