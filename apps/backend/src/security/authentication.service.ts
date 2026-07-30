/**
 * Authentication abstraction — a thin façade over `packages/api-gateway`'s
 * real `AuthenticationEngine`. No JWT signing, verification, or API-key
 * logic is reimplemented here; every method below delegates directly to
 * the gateway's own real, already-certified implementation
 * (`docs/certification/SECURITY_AUDIT.md`: constant-time JWT/HMAC
 * verification, hashed API keys, no plaintext secrets).
 *
 * This exists as its own service — rather than callers reaching into
 * the Runtime Registry's `api-gateway` entry directly — so that future
 * business endpoints depend on a stable, narrow authentication contract
 * instead of the full `ApiGatewayRuntime` surface.
 */
import { Injectable } from '@nestjs/common';
import type { AuthenticationEngine, JwtVerificationResult } from '@lateen-os/api-gateway';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class AuthenticationService {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private engine(): AuthenticationEngine | undefined {
    return this.registry.get<{ authentication: AuthenticationEngine }>('api-gateway')
      ?.authentication;
  }

  isAvailable(): boolean {
    return this.engine() !== undefined;
  }

  issueJwt(
    payload: Record<string, unknown>,
    secret: string,
    expiresInSeconds?: number,
  ): string | null {
    return this.engine()?.issueJwt(payload, secret, expiresInSeconds) ?? null;
  }

  verifyJwt(token: string, secret: string): JwtVerificationResult | null {
    return this.engine()?.verifyJwt(token, secret) ?? null;
  }
}
