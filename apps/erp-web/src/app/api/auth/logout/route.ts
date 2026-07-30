import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import * as authClient from '../../../../lib/auth/auth-client';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../../../../lib/auth/cookie-relay';

/** Logout Route Handler — revokes the real session on the backend, then clears this app's own cookies. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await authClient.logout(`${REFRESH_TOKEN_COOKIE}=${refreshToken}`).catch(() => undefined);
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}
