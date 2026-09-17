import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const roleCookie = request.cookies.get('portal_role')?.value || request.cookies.get('infotech_role')?.value;

  // Root path: redirect based on auth status
  if (pathname === '/') {
    if (roleCookie === 'ADMIN' || roleCookie === 'WORKER') {
      return NextResponse.redirect(new URL('/worker/my-dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes: require ADMIN role
  if (pathname.startsWith('/admin')) {
    if (!roleCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (roleCookie !== 'ADMIN') {
      return NextResponse.redirect(new URL('/worker/my-dashboard', request.url));
    }
  }

  // Worker routes: require logged in role (ADMIN or WORKER)
  if (pathname.startsWith('/worker')) {
    if (!roleCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Login page: if already logged in, send directly to authorized dashboard
  if (pathname === '/login') {
    if (roleCookie === 'ADMIN' || roleCookie === 'WORKER') {
      return NextResponse.redirect(new URL('/worker/my-dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/admin/:path*',
    '/worker/:path*',
  ],
};
