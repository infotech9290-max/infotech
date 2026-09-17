import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isExplicitLogout = 
    request.nextUrl.searchParams.has('logout') || 
    request.nextUrl.searchParams.has('logged_out');

  // If user specifically navigated to /login during logout, always allow login page and purge cookies
  if (pathname === '/login' && isExplicitLogout) {
    const response = NextResponse.next();
    response.cookies.delete('portal_role');
    response.cookies.delete('infotech_role');
    return response;
  }

  const roleCookie = request.cookies.get('portal_role')?.value;

  // Root path: redirect based on auth status
  if (pathname === '/') {
    if (roleCookie === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (roleCookie === 'WORKER') {
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
  if (pathname === '/login' && !isExplicitLogout) {
    if (roleCookie === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (roleCookie === 'WORKER') {
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
