import { cookies } from 'next/headers';
import { serverEnv } from './env';

export class PortalAuthError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = 'PortalAuthError';
  }
}

export function getDevBearerToken(): string {
  return `Bearer dev:${serverEnv.LATEEN_ORG_ID}:${serverEnv.LATEEN_AUTH_SUBJECT}`;
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(serverEnv.AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(serverEnv.AUTH_REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function getCustomerIdCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(serverEnv.AUTH_CUSTOMER_COOKIE_NAME)?.value ?? serverEnv.LATEEN_CUSTOMER_ID ?? null;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();
  if (accessToken) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'X-Organization-Id': serverEnv.LATEEN_ORG_ID,
      'Content-Type': 'application/json',
    };
  }
  return {
    Authorization: getDevBearerToken(),
    'X-Organization-Id': serverEnv.LATEEN_ORG_ID,
    'Content-Type': 'application/json',
  };
}

export async function requireCustomerId(): Promise<string> {
  const customerId = await getCustomerIdCookie();
  if (!customerId) {
    throw new PortalAuthError('Customer context required — sign in or set LATEEN_CUSTOMER_ID for dev', 403);
  }
  return customerId;
}

export function assertCustomerOwnership<T extends { customerId?: string }>(entity: T, customerId: string, label: string) {
  if (entity.customerId && entity.customerId !== customerId) {
    throw new PortalAuthError(`Access denied to ${label}`, 403);
  }
}

export function filterByCustomer<T extends { customerId?: string }>(items: T[], customerId: string): T[] {
  return items.filter((item) => item.customerId === customerId);
}
