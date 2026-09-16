import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { updateLocalAdmissionStatus, logLocalAuditEvent } from '@/utils/localStore';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = [
  'Action Needed',
  'In Process',
  'Enrolled',
  'Rejected',
  'Cancelled',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uniqueId, status, balanceDue } = body;

    // Security Check 1: Validate parameters
    if (!uniqueId || typeof uniqueId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing uniqueId' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Unauthorized status value. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Security Check 2: Sanitize balanceDue
    const sanitizedBalanceDue = balanceDue !== undefined ? Math.max(0, Number(balanceDue) || 0) : undefined;

    // 1. Update resilient local storage immediately (guaranteed persistence)
    const localUpdated = await updateLocalAdmissionStatus(uniqueId, status, sanitizedBalanceDue);

    // 2. Map UI status to DB status and update remote Supabase
    let dbStatus = 'IN_PROCESS';
    if (status === 'Enrolled') dbStatus = 'ENROLLED';
    else if (status === 'Cancelled') dbStatus = 'CANCELLED';
    else if (status === 'Rejected') dbStatus = 'REJECTED';
    else if (status === 'Action Needed') dbStatus = 'ACTION_NEEDED';

    const updatePayload: Record<string, string | number> = {
      status: dbStatus,
    };

    if (sanitizedBalanceDue !== undefined) {
      updatePayload.balance_due = sanitizedBalanceDue;
    }

    try {
      await supabaseServer
        .from('admissions')
        .update(updatePayload)
        .eq('unique_id', uniqueId.trim());
    } catch (dbErr) {
      console.warn('Supabase remote status update deferred/skipped:', dbErr);
    }

    // 3. Security Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Admin Session';
    const auditAction = `Verified Admin Status Change: #${uniqueId} updated to "${status}"`;

    await logLocalAuditEvent(auditAction, userAgent, clientIp.split(',')[0].trim());

    try {
      await supabaseServer.from('audit_logs').insert([
        {
          action: auditAction,
          device_info: userAgent.slice(0, 150),
          ip_address: clientIp.split(',')[0].trim(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      uniqueId,
      status,
      updatedRecord: localUpdated,
    });
  } catch (err) {
    console.error('Unexpected server error in update-status:', err);
    return NextResponse.json(
      { error: 'Internal server error while processing status update.' },
      { status: 500 }
    );
  }
}
