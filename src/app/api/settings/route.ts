import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return NextResponse.json({
          data: {
            website_name: '',
            brand: { websiteName: '', logoUrl: '' },
            courses: [],
            upi_id: '',
            bank_name: '',
            account_name: '',
            bank_account: '',
            bank_ifsc: '',
          },
          warning: error.code === 'PGRST205' ? 'Database tables not initialized yet. Visit /setup to initialize.' : undefined,
        });
      }
      throw error;
    }

    // Return data with a normalized brand object for the frontend
    return NextResponse.json({
      data: {
        ...data,
        brand: {
          websiteName: data.website_name || '',
          logoUrl: data.logo_url || '',
        },
      },
    });
  } catch (err: any) {
    console.error('Settings GET Error:', err);
    const message = err?.message || (err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: message, code: err?.code, details: err?.details }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
    if (roleCookie !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required to update settings' }, { status: 401 });
    }

    const body = await req.json();
    const { upi_id, bank_name, account_name, bank_account, bank_ifsc, courses, brand } = body;

    const payload: Record<string, unknown> = {};

    // Payment fields
    if (upi_id !== undefined) payload.upi_id = upi_id;
    if (bank_name !== undefined) payload.bank_name = bank_name;
    if (account_name !== undefined) payload.account_name = account_name;
    if (bank_account !== undefined) payload.bank_account = bank_account;
    if (bank_ifsc !== undefined) payload.bank_ifsc = bank_ifsc;

    // Courses (stored as JSONB)
    if (courses !== undefined) payload.courses = courses;

    // Brand — store as flat columns
    if (brand !== undefined) {
      if (brand.websiteName !== undefined) payload.website_name = brand.websiteName;
      if (brand.logoUrl !== undefined) payload.logo_url = brand.logoUrl;
    }

    payload.updated_at = new Date().toISOString();

    const { data: updatedRecord, error } = await supabaseServer
      .from('settings')
      .upsert({ id: 1, ...payload })
      .select()
      .single();

    if (error) throw error;

    try {
      await supabaseServer.from('audit_logs').insert([{
        action: 'Updated portal settings (branding & financial gateway)',
        device_info: req.headers.get('user-agent') || 'Admin Settings',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      }]);
    } catch {
      // non-blocking
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRecord,
        brand: {
          websiteName: updatedRecord.website_name || '',
          logoUrl: updatedRecord.logo_url || '',
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
