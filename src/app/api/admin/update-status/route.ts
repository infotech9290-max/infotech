import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

function isAdminRequest(req: NextRequest): boolean {
  const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
  return roleCookie === 'ADMIN';
}

const ALLOWED_STATUSES = [
  'Action Needed',
  'In Process',
  'Enrolled',
  'Rejected',
  'Cancelled',
];

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { uniqueId, status, balanceDue, paidAmount, phone, email, fatherName } = body;

    if (!uniqueId || typeof uniqueId !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing uniqueId' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    let statusDisplay = status;
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json({ error: `Unauthorized status value. Allowed: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
      }

      let dbStatus = 'IN_PROCESS';
      if (status === 'Enrolled') dbStatus = 'ENROLLED';
      else if (status === 'Cancelled') dbStatus = 'CANCELLED';
      else if (status === 'Rejected') dbStatus = 'REJECTED';
      else if (status === 'Action Needed') dbStatus = 'ACTION_NEEDED';

      updatePayload.status = dbStatus;
    }

    if (balanceDue !== undefined) {
      const sanitizedBalance = Math.max(0, Number(balanceDue) || 0);
      updatePayload.balance_due = sanitizedBalance;
      // If balance is cleared and status was not explicitly specified, default to Enrolled
      if (sanitizedBalance === 0 && !status) {
        updatePayload.status = 'ENROLLED';
        statusDisplay = 'Enrolled';
      }
    }

    if (paidAmount !== undefined) {
      updatePayload.paid_amount = Math.max(0, Number(paidAmount) || 0);
    }

    if (phone !== undefined && typeof phone === 'string') {
      updatePayload.phone = phone.trim();
    }

    if (email !== undefined && typeof email === 'string') {
      updatePayload.email = email.trim().toLowerCase();
    }

    if (fatherName !== undefined && typeof fatherName === 'string') {
      updatePayload.father_name = fatherName.trim();
    }

    // Attempt Atomic RPC when settling balance to zero and marking Enrolled
    let updatedRecord: any = null;
    let usedRpc = false;

    const isSettlingBalance = balanceDue !== undefined && Number(balanceDue) === 0 && (status === 'Enrolled' || statusDisplay === 'Enrolled');

    if (isSettlingBalance) {
      try {
        const { data: rpcData, error: rpcErr } = await supabaseServer.rpc('settle_student_balance', {
          p_identifier: uniqueId.trim(),
          p_utr: 'CASH-SETTLED',
          p_payment_mode: 'Admin Settlement',
        });
        if (!rpcErr && rpcData && (rpcData as any).success) {
          usedRpc = true;
          const { data: rpcRecord } = await supabaseServer
            .from('admissions')
            .select()
            .eq('unique_id', uniqueId.trim())
            .maybeSingle();
          updatedRecord = rpcRecord;
        }
      } catch {
        // Graceful fallback to table update below
      }
    }

    if (!usedRpc) {
      const { data: directRecord, error: updateErr } = await supabaseServer
        .from('admissions')
        .update(updatePayload)
        .eq('unique_id', uniqueId.trim())
        .select()
        .single();

      if (updateErr) throw updateErr;
      updatedRecord = directRecord;

      const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = req.headers.get('user-agent') || 'Unknown Device';
      const auditAction = statusDisplay
        ? `Verified Admin Status Change: #${uniqueId} updated to "${statusDisplay}"`
        : `Verified Admin Record Update: #${uniqueId}`;

      await supabaseServer.from('audit_logs').insert([{
        action: auditAction,
        device_info: userAgent.slice(0, 150),
        ip_address: clientIp.split(',')[0].trim(),
      }]);
    }

    return NextResponse.json({
      success: true,
      uniqueId,
      status: statusDisplay,
      updatedRecord,
    });
  } catch (err) {
    console.error('Unexpected server error in update-status:', err);
    return NextResponse.json(
      { error: 'Internal server error while processing student update.' },
      { status: 500 }
    );
  }
}
