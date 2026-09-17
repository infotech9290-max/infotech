import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import crypto from 'crypto';

/** Simple server-side admin check via role cookie set at login */
function isAdminRequest(req: NextRequest): boolean {
  const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
  return roleCookie === 'ADMIN';
}

// DELETE: Remove a worker by ID
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(_req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
    }

    // Prevent deleting the Super Admin
    if (id === 'ADM-01') {
      return NextResponse.json({ error: 'Cannot delete the Super Admin account' }, { status: 403 });
    }

    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', id)
      .eq('role', 'WORKER'); // Safety: only delete workers, never admins

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Worker removed successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH: Reset a worker's password (Admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { newPassword } = await req.json();

    if (!id || !newPassword) {
      return NextResponse.json({ error: 'Worker ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    const { error } = await supabaseServer
      .from('users')
      .update({ passwordHash: newHash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
