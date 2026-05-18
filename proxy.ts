import { NextResponse } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/login-customer',
  '/public-booking',
];

const customerAllowedPaths = ['/book-now', '/appointment', '/account'];
const userDisallowedAdmin = ['/appointment'];
const userDisallowedNonAdmin = ['/appointment', '/settings'];

function normalizePath(path: string): string {
  if (!path) return '/';

  return path
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '') || '/';
}
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isCustomerAllowed(pathname: string): boolean {
  return customerAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isUserAdminAllowed(pathname: string): boolean {
  return !userDisallowedAdmin.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isUserNonAdminAllowed(pathname: string): boolean {
  return !userDisallowedNonAdmin.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getLoggedInRedirect(user: any): string {
  if (!user) return '/login';
  if (String(user.role).toLowerCase() === 'customer') return '/book-now';
  return '/calendar';
}

function shouldRedirectFromLogin(user: any, pathname: string): boolean {
  return user && ['/login', '/login-customer'].includes(pathname);
}

async function fetchUser(request: any): Promise<any> {
  try {
    const apiUrl = new URL('/api/me', request.url);
    const apiResponse = await fetch(apiUrl.toString(), {
      headers: request.headers,
      cache: 'no-store',
    });

    if (!apiResponse.ok) {
      return null;
    }

    const json = await apiResponse.json();
    return json?.user ?? null;
  } catch (error) {
    return null;
  }
}

function canAccess(user: any, pathname: string): boolean {
  if (!user) return isPublicPath(pathname);

  const role = String(user.role || '').toLowerCase();
  if (role === 'customer') {
    return isPublicPath(pathname) || isCustomerAllowed(pathname);
  }

  if (role === 'user') {
    const isAdmin = user?.is_admin === true || String(user?.is_admin || '').toLowerCase() === 'true';

    if (isAdmin) {
      return isPublicPath(pathname) || isUserAdminAllowed(pathname);
    }

    return isPublicPath(pathname) || isUserNonAdminAllowed(pathname);
  }

  return isPublicPath(pathname);
}

export default async function proxy(request: any): Promise<NextResponse> {
  const pathname = normalizePath(request.nextUrl.pathname);
  const isApiPath = pathname.startsWith('/api/');

  if (isApiPath) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('auth_session')?.value;

  if (isPublicPath(pathname)) {
    if (sessionToken && ['/login', '/login-customer'].includes(pathname)) {
      const user = await fetchUser(request);
      return NextResponse.redirect(new URL(getLoggedInRedirect(user), request.url));
    }
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return response;
  }

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = await fetchUser(request);
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (shouldRedirectFromLogin(user, pathname)) {
    return NextResponse.redirect(new URL(getLoggedInRedirect(user), request.url));
  }

  if (!canAccess(user, pathname)) {
    return NextResponse.redirect(new URL(getLoggedInRedirect(user), request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api(?:/|$)).*)',
  ],
};