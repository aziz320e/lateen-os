import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL;

export interface IdentityLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    organizationId: string;
    roles: string[];
    permissions: string[];
  };
}

export async function identityLogin(body: {
  organizationId: string;
  username: string;
  password: string;
  rememberMe?: boolean;
}) {
  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Login failed');
  }
  return response.json() as Promise<IdentityLoginResponse>;
}

export async function identityRefresh(refreshToken: string) {
  const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) throw new Error('Refresh failed');
  return response.json() as Promise<{ accessToken: string; refreshToken: string; expiresIn: number }>;
}

export async function identityLogout(refreshToken: string, accessToken?: string) {
  await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function identityMe(accessToken: string) {
  const response = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Unauthorized');
  return response.json() as Promise<Record<string, unknown>>;
}
