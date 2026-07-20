import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../config/index';
import type { GatewayRequestContext } from '../domain/types';

const JWT_SEGMENT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function createCorrelationId(existing?: string): string {
  return existing?.trim() || randomUUID();
}

export function resolveLocale(header?: string): string {
  if (!header) return 'en';
  return header.split(',')[0]?.trim().slice(0, 16) || 'en';
}

export function parseJwtPayload(token: string, secret?: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !JWT_SEGMENT_PATTERN.test(token)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8')) as Record<string, unknown>;
    if (secret && payload.iss !== 'lateen-gateway-dev') {
      // stub validation — production would verify signature
    }
    return payload;
  } catch {
    return null;
  }
}

export function resolveRequestContext(
  headers: Record<string, string | string[] | undefined>,
  config: AppConfig,
): GatewayRequestContext {
  const correlationId = createCorrelationId(getHeader(headers, 'x-correlation-id'));
  const locale = resolveLocale(getHeader(headers, 'accept-language'));
  const tenantHeader = getHeader(headers, 'x-tenant-id');
  const apiKey = getHeader(headers, 'x-api-key');
  const serviceToken = getHeader(headers, 'x-service-token');
  const authorization = getHeader(headers, 'authorization');

  if (apiKey) {
    return {
      correlationId,
      tenantId: tenantHeader,
      permissions: ['api:access'],
      locale,
      authType: 'api-key',
      userId: `api-key:${apiKey.slice(0, 8)}`,
    };
  }

  if (serviceToken) {
    return {
      correlationId,
      tenantId: tenantHeader,
      permissions: ['service:invoke'],
      locale,
      authType: 'service-token',
      userId: 'service',
    };
  }

  if (authorization?.startsWith('Bearer ')) {
    const token = authorization.slice(7);
    const payload = parseJwtPayload(token, config.JWT_SECRET);
    const tenantId =
      tenantHeader ??
      (typeof payload?.tenantId === 'string' ? payload.tenantId : undefined) ??
      (typeof payload?.organizationId === 'string' ? payload.organizationId : undefined);
    const userId = typeof payload?.sub === 'string' ? payload.sub : undefined;
    const permissions = Array.isArray(payload?.permissions)
      ? payload.permissions.filter((p): p is string => typeof p === 'string')
      : ['authenticated'];
    return { correlationId, tenantId, userId, permissions, locale, authType: 'jwt' };
  }

  return { correlationId, tenantId: tenantHeader, permissions: [], locale };
}

export function assertAuthorized(context: GatewayRequestContext, authRequired: boolean): void {
  if (!authRequired) return;
  if (context.permissions.length === 0 && !context.authType) {
    throw new GatewayAuthError('Authentication required');
  }
}

export class GatewayAuthError extends Error {
  readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'GatewayAuthError';
  }
}

function getHeader(headers: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
