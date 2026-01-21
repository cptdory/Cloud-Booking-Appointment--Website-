import { NextResponse } from 'next/server';

async function getOrgSetup() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const res = await fetch(
      `${baseUrl}/api/booking-organization-setup/get-booking-organization-setup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _TenantId: "9903ED01-A73C-4874-8ABF-D2678E3AE23D", // Sample tenant ID (placeholder)
        }),
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch organization setup:", res.statusText);
      return null; // Deny access on error (fail secure)
    }

    const data = await res.json();
    const finalData = data.data;
    return finalData || null;
  } catch (error) {
    console.error("Error checking public booking status:", error);
    return null;
  }
}

export default async function proxy(request) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/login',
    '/login-customer',
    '/register-customer',
    '/unavailable',
    '/api/auth/login-bc',
    '/api/auth/login-user',
    '/api/auth/create-user',
    '/api/auth/token',
    '/api/booking-organization-setup/get-booking-organization-setup',
    '/'
  ];

  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );

  const isApiRoute = pathname.startsWith('/api/');
  const isAuthApi = pathname.startsWith('/api/auth/');
  const sessionToken = request.cookies.get('session_token')?.value;


  // Check public booking status for /book-now and customer portal for /login-customer
  if (pathname.startsWith('/book-now') || pathname.startsWith('/login-customer')) {
    const orgSetup = await getOrgSetup();
    if (!orgSetup) {
      // If cannot fetch, block access with generic message
      const url = new URL('/unavailable', request.url);
      url.searchParams.set('desc', 'The system is temporarily unavailable. Please contact the administrator.');
      return NextResponse.redirect(url);
    }
    // console.log('orgSetup full object:', orgSetup);
    
    // Check if EnablePublicBooking and EnableCustomerPortal are true
    const enablePublicBooking = typeof orgSetup?.EnablePublicBooking === 'string' 
      ? orgSetup.EnablePublicBooking.toLowerCase() === 'true' 
      : Boolean(orgSetup?.EnablePublicBooking);
    
    const enableCustomerPortal = typeof orgSetup?.EnableCustomerPortal === 'string' 
      ? orgSetup.EnableCustomerPortal.toLowerCase() === 'true' 
      : Boolean(orgSetup?.EnableCustomerPortal);
    
    if (pathname.startsWith('/book-now') && !enablePublicBooking) {
      const url = new URL('/unavailable', request.url);
      url.searchParams.set('desc', 'Public Booking is Currently Disabled. Please contact the administrator for access.');
      return NextResponse.redirect(url);
    }
    
    if (pathname.startsWith('/login-customer') && !enableCustomerPortal) {
      const url = new URL('/unavailable', request.url);
      url.searchParams.set('desc', 'Customer Portal is Currently Disabled. Please contact the administrator for access.');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isPublicPath) {
    if (sessionToken && (pathname === '/login' || pathname === '/login-customer' || pathname === '/register-customer')) {
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

    const signinUrl = new URL('/login', request.url);
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
