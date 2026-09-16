import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import { getLocalSettings, saveLocalSettings } from '@/utils/localStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      const { data, error } = await supabaseServer
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        return NextResponse.json({ data });
      }
    } catch (dbErr) {
      console.warn('Supabase settings query skipped, using resilient store:', dbErr);
    }

    const localData = await getLocalSettings();
    return NextResponse.json({ data: localData });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const localData = await getLocalSettings();
    return NextResponse.json({ data: localData, fallback: true, error: message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { upi_id, bank_name, bank_account, bank_ifsc } = body;

    const payload = {
      upi_id: upi_id || 'infotech@icici',
      bank_name: bank_name || 'INFO TECH PVT LTD',
      bank_account: bank_account || '31245678901',
      bank_ifsc: bank_ifsc || 'SBIN0001234',
    };

    // 1. Resilient local update
    const updatedLocal = await saveLocalSettings(payload);

    // 2. Remote Supabase update
    try {
      await supabaseServer
        .from('settings')
        .upsert({
          id: 1,
          ...payload,
          updated_at: new Date().toISOString(),
        });
    } catch (dbErr) {
      console.warn('Supabase settings upsert skipped:', dbErr);
    }

    return NextResponse.json({ success: true, data: updatedLocal });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
