import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/utils/supabaseServer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

function readLocalSettings(): Record<string, any> | null {
  try {
    if (fs.existsSync(LOCAL_SETTINGS_FILE)) {
      const content = fs.readFileSync(LOCAL_SETTINGS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading local settings file:', err);
  }
  return null;
}

function writeLocalSettings(data: Record<string, any>) {
  try {
    const dir = path.dirname(LOCAL_SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local settings file:', err);
  }
}

export async function GET() {
  const localData = readLocalSettings();

  try {
    const { data, error } = await supabaseServer
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        const fallback = localData || {};
        return NextResponse.json({
          data: {
            website_name: fallback.website_name || '',
            brand: {
              websiteName: fallback.website_name || fallback.brand?.websiteName || '',
              logoUrl: fallback.logo_url || fallback.brand?.logoUrl || '',
            },
            courses: fallback.courses || [],
            upi_id: fallback.upi_id || '',
            bank_name: fallback.bank_name || '',
            account_name: fallback.account_name || '',
            bank_account: fallback.bank_account || '',
            bank_ifsc: fallback.bank_ifsc || '',
          },
          warning: error.code === 'PGRST205' ? 'Database tables not initialized yet. Visit /setup to initialize.' : undefined,
        });
      }
      throw error;
    }

    // Merge Supabase with any local fields
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
    if (localData) {
      return NextResponse.json({
        data: {
          website_name: localData.website_name || '',
          brand: {
            websiteName: localData.website_name || localData.brand?.websiteName || '',
            logoUrl: localData.logo_url || localData.brand?.logoUrl || '',
          },
          courses: localData.courses || [],
          upi_id: localData.upi_id || '',
          bank_name: localData.bank_name || '',
          account_name: localData.account_name || '',
          bank_account: localData.bank_account || '',
          bank_ifsc: localData.bank_ifsc || '',
        },
      });
    }
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

    // Load existing settings to merge partial updates cleanly
    const existingLocal = readLocalSettings() || {};
    const payload: Record<string, unknown> = { ...existingLocal };

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

    // 1. Always save to local fallback storage so changes are never lost
    writeLocalSettings(payload);

    let updatedRecord: any = null;
    let dbWarning: string | undefined;

    // 2. Try saving to Supabase
    try {
      const { data, error } = await supabaseServer
        .from('settings')
        .upsert({ id: 1, ...payload })
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST205') {
          dbWarning = 'Settings saved locally. Note: Supabase tables not initialized yet. Visit the DB Setup tab to initialize.';
        } else {
          console.warn('Supabase settings upsert warning:', error);
          dbWarning = error.message;
        }
      } else {
        updatedRecord = data;
      }
    } catch (dbErr: any) {
      console.warn('Supabase settings upsert caught error:', dbErr);
      dbWarning = dbErr?.message || 'Database unavailable, saved locally.';
    }

    // 3. Try audit log (non-blocking)
    try {
      await supabaseServer.from('audit_logs').insert([{
        action: 'Updated portal settings (branding & financial gateway)',
        device_info: req.headers.get('user-agent') || 'Admin Settings',
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
      }]);
    } catch {
      // non-blocking
    }

    const finalRecord = updatedRecord || payload;

    return NextResponse.json({
      success: true,
      warning: dbWarning,
      data: {
        ...finalRecord,
        brand: {
          websiteName: finalRecord.website_name || (brand?.websiteName || ''),
          logoUrl: finalRecord.logo_url || (brand?.logoUrl || ''),
        },
      },
    });
  } catch (err: any) {
    console.error('Settings POST Error:', err);
    const message = err?.message || (err instanceof Error ? err.message : String(err)) || 'Failed to save settings';
    return NextResponse.json({ error: message, code: err?.code }, { status: 500 });
  }
}
