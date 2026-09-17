import { NextRequest, NextResponse } from 'next/server';
import { SCHEMA_SQL } from '@/utils/schemaSql';

// Supabase project ref extracted from the URL
const PROJECT_REF = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname.split('.')[0]
  : '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pat = body.pat || process.env.SUPABASE_PAT;

    if (!pat || !pat.startsWith('sbp_')) {
      return NextResponse.json(
        { error: 'Invalid Personal Access Token. It should start with sbp_ (or be set in SUPABASE_PAT env var)' },
        { status: 400 }
      );
    }

    if (!PROJECT_REF) {
      return NextResponse.json(
        { error: 'SUPABASE_URL is not configured in .env.local' },
        { status: 500 }
      );
    }

    // Call Supabase Management API to run SQL
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pat}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Supabase API error: ${errText}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully! All tables created.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
