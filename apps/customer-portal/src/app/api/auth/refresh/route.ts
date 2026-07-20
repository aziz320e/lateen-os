import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env';
import { identityRefresh } from '@/lib/api/identity-server';

export async function POST() {
  try {
    const jar = await cookies();
    const refreshToken = jar.get(serverEnv.AUTH_REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const tokens = await identityRefresh(refreshToken);
    jar.set(serverEnv.AUTH_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: serverEnv.AUTH_COOKIE_SECURE,
      sameSite: 'lax',
      path: '/',
      maxAge: tokens.expiresIn,
    });
    jar.set(serverEnv.AUTH_REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: serverEnv.AUTH_COOKIE_SECURE,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Refresh failed' }, { status: 401 });
  }
}
