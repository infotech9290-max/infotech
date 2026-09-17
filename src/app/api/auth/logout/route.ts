import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  response.cookies.set('portal_role', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });
  
  response.cookies.set('infotech_role', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  return response;
}

export async function GET(request: Request) {
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);
  
  response.cookies.set('portal_role', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });
  
  response.cookies.set('infotech_role', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    sameSite: 'lax',
  });

  return response;
}
