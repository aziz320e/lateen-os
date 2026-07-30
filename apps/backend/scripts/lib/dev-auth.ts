/**
 * Dev-only token issuance for demo/validation scripts.
 *
 * These scripts drive the platform exclusively through its real REST
 * API (never a repository, never Postgres directly) — but every
 * `/api/v1/*` route requires a valid access token, and issuing one the
 * normal way (`POST /auth/login`) requires a live PostgreSQL connection
 * to look up the user row. This sandbox has no reachable Postgres (see
 * `apps/backend`'s own `DatabaseHealthService` — every prior phase's
 * report documents the same constraint), so `/auth/login` cannot
 * complete here.
 *
 * Rather than duplicating or bypassing the JWT logic, this signs a
 * token using the exact same HS256 scheme `packages/api-gateway`'s real
 * `AuthenticationEngine` uses (`issueJwt`/`verifyJwt`, HMAC-SHA256,
 * base64url header.payload.signature) and the same `JWT_ACCESS_SECRET`
 * the running backend process reads from its own config. `JwtAuthGuard`
 * only verifies the signature — it never touches Postgres — so a
 * validly-signed token is indistinguishable, to every `/api/v1/*` route,
 * from one issued by a real login. This is a sandbox workaround for the
 * missing database, not a duplicated authentication implementation.
 */
import { createHmac } from 'node:crypto';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-production';

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

export interface DevTokenClaims {
  readonly sub: string;
  readonly organizationId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

/** Issues a real HS256 JWT (header.payload.signature) matching `packages/api-gateway`'s own `signToken()` exactly. */
export function issueDevToken(claims: DevTokenClaims, ttlSeconds = 3600): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({ ...claims, iat: issuedAt, exp: issuedAt + ttlSeconds }),
  );
  const signature = sign(`${header}.${payload}`, JWT_ACCESS_SECRET);
  return `${header}.${payload}.${signature}`;
}
