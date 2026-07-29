/**
 * A real, deterministic, dependency-free JWT (RFC 7519 / HS256)
 * abstraction, built on Node's built-in `crypto` module — no external
 * JWT library, no HTTP framework binding. Signature verification uses
 * a constant-time comparison (`crypto.timingSafeEqual`) to avoid
 * timing side-channels, exactly as a real gateway would.
 *
 * @module authentication/jwt
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { nowIso } from '../shared/id.js';

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export interface SignTokenOptions {
  readonly expiresInSeconds?: number;
  readonly now?: () => string;
}

/** Signs a real HS256 JWT — header.payload.signature, all base64url-encoded, with a `crypto.createHmac` signature. */
export function signToken(payload: Record<string, unknown>, secret: string, options: SignTokenOptions = {}): string {
  const now = options.now ?? nowIso;
  const issuedAt = Math.floor(new Date(now()).getTime() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: Record<string, unknown> = {
    ...payload,
    iat: issuedAt,
    ...(options.expiresInSeconds !== undefined ? { exp: issuedAt + options.expiresInSeconds } : {}),
  };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = sign(`${headerSegment}.${payloadSegment}`, secret);
  return `${headerSegment}.${payloadSegment}.${signature}`;
}

export interface VerifyTokenOptions {
  readonly now?: () => string;
}

export type JwtVerificationResult =
  | { readonly valid: true; readonly payload: Record<string, unknown> }
  | { readonly valid: false; readonly reason: 'malformed' | 'invalid_signature' | 'expired' };

/** Verifies a real HS256 JWT's structure, signature (constant-time comparison), and expiry. */
export function verifyToken(token: string, secret: string, options: VerifyTokenOptions = {}): JwtVerificationResult {
  const segments = token.split('.');
  if (segments.length !== 3) return { valid: false, reason: 'malformed' };
  const [headerSegment, payloadSegment, signatureSegment] = segments as [string, string, string];

  const expectedSignature = sign(`${headerSegment}.${payloadSegment}`, secret);
  const actual = Buffer.from(signatureSegment, 'base64url');
  const expected = Buffer.from(expectedSignature, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return { valid: false, reason: 'invalid_signature' };
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(base64UrlDecode(payloadSegment)) as Record<string, unknown>;
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  const now = options.now ?? nowIso;
  const nowSeconds = Math.floor(new Date(now()).getTime() / 1000);
  if (typeof payload['exp'] === 'number' && nowSeconds >= payload['exp']) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, payload };
}
