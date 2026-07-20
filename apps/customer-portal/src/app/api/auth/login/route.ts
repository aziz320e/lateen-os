import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env';
import { identityLogin, identityLogout, identityMe, identityRefresh } from '@/lib/api/identity-server';
import { resolveCustomerIdByEmail } from '@/lib/api/business-dna-server';

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: serverEnv.AUTH_COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body as { username: string; password: string; rememberMe?: boolean };

    const result = await identityLogin({
      organizationId: serverEnv.LATEEN_ORG_ID,
      username,
      password,
      rememberMe,
    });

    let customerId = await resolveCustomerIdByEmail(result.user.email);
    if (!customerId && serverEnv.LATEEN_CUSTOMER_ID) {
      customerId = serverEnv.LATEEN_CUSTOMER_ID;
    }
    if (!customerId) {
      return NextResponse.json({ error: 'No customer account linked to this user' }, { status: 403 });
    }

    const jar = await cookies();
    jar.set(serverEnv.AUTH_COOKIE_NAME, result.accessToken, cookieOptions(result.expiresIn));
    jar.set(
      serverEnv.AUTH_REFRESH_COOKIE_NAME,
      result.refreshToken,
      cookieOptions(rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7),
    );
    jar.set(serverEnv.AUTH_CUSTOMER_COOKIE_NAME, customerId, cookieOptions(60 * 60 * 24 * 30));

    return NextResponse.json({
      user: { ...result.user, customerId },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const jar = await cookies();
    const refresh = jar.get(serverEnv.AUTH_REFRESH_COOKIE_NAME)?.value;
    const access = jar.get(serverEnv.AUTH_COOKIE_NAME)?.value;
    if (refresh) await identityLogout(refresh, access);
    jar.delete(serverEnv.AUTH_COOKIE_NAME);
    jar.delete(serverEnv.AUTH_REFRESH_COOKIE_NAME);
    jar.delete(serverEnv.AUTH_CUSTOMER_COOKIE_NAME);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
