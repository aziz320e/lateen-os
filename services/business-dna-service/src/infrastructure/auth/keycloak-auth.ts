import type { AuthContext, AuthProvider } from '../../domain/ports.js';
import type { OrganizationId } from '@lateen-os/business-dna';

/** Keycloak-ready JWT claims shape (contract only — no Keycloak server). */
export interface KeycloakTokenClaims {
  readonly sub: string;
  readonly iss?: string;
  readonly aud?: string | readonly string[];
  readonly exp?: number;
  readonly iat?: number;
  readonly realm_access?: { readonly roles?: readonly string[] };
  readonly resource_access?: Record<string, { readonly roles?: readonly string[] }>;
  readonly organization_id?: string;
  readonly permissions?: readonly string[];
}

export interface KeycloakAuthConfig {
  readonly enabled: boolean;
  readonly realm: string;
  readonly clientId: string;
  readonly issuerUrl: string;
}

export interface KeycloakTokenValidator {
  validate(token: string): Promise<KeycloakTokenClaims | null>;
}

/** Development auth provider — accepts Bearer dev tokens or X-Organization-Id header. */
export class DevelopmentAuthProvider implements AuthProvider {
  async authenticate(token: string | undefined): Promise<AuthContext | null> {
    if (!token) {
      return {
        subject: 'anonymous',
        roles: [],
        permissions: [],
      };
    }
    if (token.startsWith('dev:')) {
      const [, orgId, subject = 'dev-user'] = token.split(':');
      return {
        subject,
        organizationId: orgId as OrganizationId,
        roles: ['admin'],
        permissions: ['*:*'],
        bearerToken: token,
      };
    }
    return null;
  }
}

/** Keycloak-ready auth provider (validates via injected validator contract). */
export class KeycloakAuthProvider implements AuthProvider {
  constructor(
    private readonly config: KeycloakAuthConfig,
    private readonly validator: KeycloakTokenValidator,
  ) {}

  async authenticate(token: string | undefined): Promise<AuthContext | null> {
    if (!token) return null;
    if (!this.config.enabled) {
      return new DevelopmentAuthProvider().authenticate(`dev:${token}`);
    }
    const claims = await this.validator.validate(token);
    if (!claims) return null;
    const roles = claims.realm_access?.roles ?? [];
    return {
      subject: claims.sub,
      organizationId: claims.organization_id as OrganizationId | undefined,
      roles,
      permissions: claims.permissions ?? [],
      bearerToken: token,
    };
  }
}
