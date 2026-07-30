/**
 * Token Service — Access Tokens are real HS256 JWTs, issued and verified
 * exclusively through `AuthenticationService` (a façade over
 * `packages/api-gateway`'s real `AuthenticationEngine.issueJwt`/
 * `verifyJwt`) — no JWT signing/verification is reimplemented here.
 * Refresh Tokens are opaque, cryptographically random secrets (not JWTs):
 * only their SHA-256 hash is ever persisted, so a stolen database row
 * cannot be replayed as a credential.
 */
import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig } from '../config/index.js';
import { APP_CONFIG } from '../api/tokens.js';
import { AuthenticationService } from '../security/authentication.service.js';

export interface AccessTokenPayload {
  readonly sub: string;
  readonly organizationId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly authentication: AuthenticationService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  issueAccessToken(payload: AccessTokenPayload): string | null {
    return this.authentication.issueJwt(
      { ...payload },
      this.config.JWT_ACCESS_SECRET,
      this.config.ACCESS_TOKEN_TTL_SECONDS,
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    const result = this.authentication.verifyJwt(token, this.config.JWT_ACCESS_SECRET);
    if (!result || !result.valid) return null;
    const { sub, organizationId, roles, permissions } = result.payload;
    if (typeof sub !== 'string' || typeof organizationId !== 'string') return null;
    return {
      sub,
      organizationId,
      roles: Array.isArray(roles) ? (roles as string[]) : [],
      permissions: Array.isArray(permissions) ? (permissions as string[]) : [],
    };
  }

  /** Issues a new opaque refresh secret, returning both the raw value (given to the client exactly once) and its SHA-256 hash (the only form ever persisted). */
  issueRefreshSecret(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('base64url');
    return { raw, hash: this.hashRefreshSecret(raw) };
  }

  hashRefreshSecret(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
