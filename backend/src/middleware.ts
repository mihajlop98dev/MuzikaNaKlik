import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/api/health',
  '/api/auth/register/performer',
  '/api/auth/register/client',
  // Must stay public: the only people who need it are those who cannot log in
  // yet because their email is unconfirmed, so they have no token to send.
  '/api/auth/resend-confirmation',
  // Public for the same reason: whoever needs it cannot log in to get a token.
  '/api/auth/forgot-password',
  '/api/genres',
  '/api/equipment',
  '/api/languages',
  '/api/subscription-plans',
  '/api/stripe/webhook',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow OPTIONS (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204 });
  }

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
