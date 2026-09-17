import { NextRequest, NextResponse } from 'next/server';
import { testSmtpConnection } from '@/utils/emailService';

export const dynamic = 'force-dynamic';

function isAdminRequest(req: NextRequest): boolean {
  const roleCookie = req.cookies.get('portal_role')?.value || req.cookies.get('infotech_role')?.value;
  return roleCookie === 'ADMIN';
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { user, pass, recipient } = body;

    if (!user || !pass) {
      return NextResponse.json({ error: 'Gmail address and App Password are required' }, { status: 400 });
    }

    const testTarget = recipient && recipient.includes('@') ? recipient.trim() : user.trim();

    await testSmtpConnection({ user: user.trim(), pass: pass.trim() }, testTarget);

    return NextResponse.json({
      success: true,
      message: `Test email successfully sent to ${testTarget} via Gmail SMTP!`,
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') console.error('SMTP test connection failed:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to authenticate with Gmail SMTP. Check your 16-character App Password.' },
      { status: 500 }
    );
  }
}
