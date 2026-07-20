import { serverEnv } from '@/lib/env';

export async function getIdentityHealth() {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL;
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
    return { name: 'identity-service', url: `${baseUrl}/health`, status: response.ok ? ('ok' as const) : ('degraded' as const) };
  } catch {
    return { name: 'identity-service', url: `${baseUrl}/health`, status: 'down' as const };
  }
}

export async function getAuthMe() {
  const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL;
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: {
      Authorization: `Bearer dev:${serverEnv.LATEEN_ORG_ID}:${serverEnv.LATEEN_AUTH_SUBJECT}`,
      'X-Organization-Id': serverEnv.LATEEN_ORG_ID,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}
