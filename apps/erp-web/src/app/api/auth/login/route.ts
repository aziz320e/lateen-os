import { NextResponse, type NextRequest } from 'next/server';
import * as authClient from '../../../../lib/auth/auth-client';
import { parseSetCookies } from '../../../../lib/auth/cookie-relay';
import { ApiError } from '../../../../lib/api/http';

/**
 * Login Route Handler — the only place in this app that can persist
 * cookies (Server Components can only read them). Calls the backend's
 * real `POST /auth/login`, then relays its `Set-Cookie` response
 * headers as this app's own cookies (same names/attributes), so
 * subsequent Server Component renders can read them.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const organizationId = String(form.get('organizationId') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!organizationId || !email || !password) {
    return NextResponse.redirect(new URL('/login?error=missing-fields', request.url));
  }

  try {
    const result = await authClient.login({ organizationId, email, password });
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    for (const cookie of parseSetCookies(result.setCookies)) {
      response.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        path: cookie.path,
        maxAge: cookie.maxAge,
      });
    }
    return response;
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'Unable to reach the platform backend.';
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
