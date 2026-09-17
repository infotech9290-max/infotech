import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');

    let query = supabaseServer
      .from('admissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (workerId) {
      query = query.or(`worker_id.eq.${workerId},worker_email.ilike.${workerId}`);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          data: [],
          warning: 'Database tables not initialized yet. Visit /setup to initialize.',
        });
      }
      throw error;
    }

    return NextResponse.json({ data: data || [], source: 'supabase' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      unique_id,
      student_name,
      father_name,
      email,
      phone,
      graduation_course,
      graduation_session,
      tenth_marks,
      tenth_school,
      tenth_year,
      twelfth_details,
      twelfth_year,
      twelfth_stream,
      status,
      worker_id,
      worker_name,
      worker_email,
      balance_due,
      total_fee,
      discount,
      paid_amount,
      payment_method,
      payment_utr,
      payment_screenshot_url,
      photo_url,
      dossier_pdf_url,
    } = body;

    if (!student_name || typeof student_name !== 'string' || !student_name.trim()) {
      return NextResponse.json({ error: 'Valid student name is mandatory.' }, { status: 400 });
    }

    const workerTag = (worker_id || 'ADM01').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanUniqueId = unique_id 
      ? String(unique_id).trim() 
      : `STU-${workerTag}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sanitizedBalanceDue = Math.max(0, Number(balance_due) || 0);
    const sanitizedTotalFee = Math.max(0, Number(total_fee) || 0);
    const sanitizedDiscount = Math.max(0, Number(discount) || 0);
    const sanitizedPaidAmount = Math.max(0, Number(paid_amount) || Math.max(0, sanitizedTotalFee - sanitizedDiscount - sanitizedBalanceDue));

    const insertPayload = {
      unique_id: cleanUniqueId,
      student_name: String(student_name).trim(),
      father_name: father_name ? String(father_name).trim() : '',
      email: email ? String(email).trim().toLowerCase() : '',
      phone: phone ? String(phone).trim() : '',
      graduation_course: graduation_course || '',
      graduation_session: graduation_session || '',
      tenth_school: tenth_school || '',
      tenth_marks: tenth_marks || '',
      tenth_year: tenth_year || '',
      twelfth_details: twelfth_details || '',
      twelfth_year: twelfth_year || '',
      twelfth_stream: twelfth_stream || '',
      status: status || 'Action Needed',
      worker_id: worker_id ? String(worker_id).trim() : '',
      worker_name: worker_name ? String(worker_name).trim() : '',
      worker_email: worker_email || '',
      balance_due: sanitizedBalanceDue,
      total_fee: sanitizedTotalFee,
      discount: sanitizedDiscount,
      paid_amount: sanitizedPaidAmount,
      payment_method: payment_method || 'UPI QR',
      payment_utr: payment_utr || '',
      payment_screenshot_url: payment_screenshot_url || '',
      photo_url: photo_url || undefined,
      dossier_pdf_url: dossier_pdf_url || undefined,
      tenth_marksheet_url: body.tenth_marksheet_url || undefined,
      twelfth_marksheet_url: body.twelfth_marksheet_url || undefined,
      created_at: new Date().toISOString(),
    };

    const { data: savedRecord, error: insertError } = await supabaseServer
      .from('admissions')
      .insert([insertPayload])
      .select()
      .single();

    if (insertError) throw insertError;

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const auditAction = `New Student Admission Registered: ${insertPayload.student_name} (#${cleanUniqueId})`;

    await supabaseServer.from('audit_logs').insert([{
      action: auditAction,
      device_info: userAgent.slice(0, 150),
      ip_address: clientIp.split(',')[0].trim(),
    }]);

    return NextResponse.json({
      success: true,
      data: savedRecord,
      message: 'Admission registered and secured.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to register admission.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

