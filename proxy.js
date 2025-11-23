import { NextResponse } from 'next/server';

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/signin',
    '/signup',
    '/api/auth/login-bc',
    '/api/auth/login-user',
    '/api/auth/create-user',
    '/api/auth/token',
    '/'
  ];

  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );

  const isApiRoute = pathname.startsWith('/api/');
  const isAuthApi = pathname.startsWith('/api/auth/');
  const sessionToken = request.cookies.get('session_token')?.value;

  if (isPublicPath) {
    if (sessionToken && (pathname === '/signin' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/calendar', request.url));
    }
    return NextResponse.next();
  }

  if (!sessionToken) {
    if (isApiRoute && !isAuthApi) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to access this resource' },
        { status: 401 }
      );
    }

    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
