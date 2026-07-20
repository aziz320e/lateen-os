import type { AppConfig } from '../config/index';

export interface GatewayPolicies {
  maxRequestBytes: number;
  requestTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  cacheTtlSeconds: number;
}

export function loadPolicies(config: AppConfig): GatewayPolicies {
  return {
    maxRequestBytes: config.MAX_REQUEST_BYTES,
    requestTimeoutMs: config.REQUEST_TIMEOUT_MS,
    retryAttempts: config.RETRY_ATTEMPTS,
    retryDelayMs: config.RETRY_DELAY_MS,
    rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: config.RATE_LIMIT_MAX,
    cacheTtlSeconds: config.CACHE_TTL_SECONDS,
  };
}

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Gateway': 'lateen-os-api-gateway',
};

export const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);
