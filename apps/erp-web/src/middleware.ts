import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './lib/auth/cookie-relay';

/**
 * Route guard — redirects to `/login` when neither an access token nor a
 * refresh token cookie is present. Runs on the Edge runtime (Next.js
 * middleware default), so it only ever reads cookies — no network call
 * to the backend here. Expired-access-token handling (calling
 * `POST /auth/refresh`) happens server-side in `src/lib/api/client.ts`,
 * which retries once against the backend on a real `401` before giving
 * up — see that file's doc comment for why the refresh call itself
 * isn't done here.
 */
const PUBLIC_PATHS = ['/login', '/api/auth'];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path)) || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const hasAccessToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const hasRefreshToken = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);
  if (!hasAccessToken && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
