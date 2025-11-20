import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/signin',
    '/signup',
    '/api/auth/login-bc',
    '/api/auth/login-user',
    '/api/auth/create-user',
    '/api/auth/token',
    '/'
  ];

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );

  // Check if the path is an API route (but not auth APIs)
  const isApiRoute = pathname.startsWith('/api/');
  const isAuthApi = pathname.startsWith('/api/auth/');

  // Get the session token from cookies
  const sessionToken = request.cookies.get('session_token')?.value;

  // If it's a public path, allow access
  if (isPublicPath) {
    // If user is already authenticated and tries to access signin, redirect to dashboard
    if (sessionToken && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // If no session token and trying to access protected route, redirect to signin
  if (!sessionToken) {
    // For API routes, return JSON error
    if (isApiRoute && !isAuthApi) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to signin
    const signinUrl = new URL('/signin', request.url);
    // Add redirect URL as query parameter for after login
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // User has valid token, allow access to protected routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback routes (if any)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};