import type { AppConfig } from '../../config/index';
import type { AuthContext, KeycloakAdapter, TokenPair } from '../../domain/ports';

/** Keycloak adapter — OIDC/OAuth2 contract with graceful fallback when Keycloak is disabled. */
export class KeycloakAdapterImpl implements KeycloakAdapter {
  constructor(private readonly config: AppConfig) {}

  async exchangePassword(username: string, password: string): Promise<TokenPair | null> {
    if (!this.config.KEYCLOAK_ENABLED) return null;
    return this.tokenRequest({
      grant_type: 'password',
      username,
      password,
      client_id: this.config.KEYCLOAK_CLIENT_ID,
      client_secret: this.config.KEYCLOAK_CLIENT_SECRET || undefined,
    });
  }

  async exchangeCode(code: string, redirectUri: string): Promise<TokenPair | null> {
    if (!this.config.KEYCLOAK_ENABLED) return null;
    return this.tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: this.config.KEYCLOAK_CLIENT_ID,
      client_secret: this.config.KEYCLOAK_CLIENT_SECRET || undefined,
    });
  }

  async refresh(refreshToken: string): Promise<TokenPair | null> {
    if (!this.config.KEYCLOAK_ENABLED) return null;
    return this.tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.KEYCLOAK_CLIENT_ID,
      client_secret: this.config.KEYCLOAK_CLIENT_SECRET || undefined,
    });
  }

  async introspect(token: string): Promise<AuthContext | null> {
    if (!this.config.KEYCLOAK_ENABLED) return null;
    try {
      const url = `${this.config.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/token/introspect`;
      const body = new URLSearchParams({
        token,
        client_id: this.config.KEYCLOAK_CLIENT_ID,
        client_secret: this.config.KEYCLOAK_CLIENT_SECRET,
      });
      const response = await fetch(url, { method: 'POST', body });
      if (!response.ok) return null;
      const data = (await response.json()) as Record<string, unknown>;
      if (!data.active) return null;
      return {
        subject: String(data.sub ?? ''),
        subjectType: 'user',
        organizationId: String(data.organization_id ?? data.org_id ?? ''),
        roles: ((data.realm_access as { roles?: string[] })?.roles) ?? [],
        permissions: (data.permissions as string[]) ?? [],
      };
    } catch {
      return null;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    if (!this.config.KEYCLOAK_ENABLED) return;
    const url = `${this.config.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/logout`;
    const body = new URLSearchParams({
      client_id: this.config.KEYCLOAK_CLIENT_ID,
      client_secret: this.config.KEYCLOAK_CLIENT_SECRET,
      refresh_token: refreshToken,
    });
    await fetch(url, { method: 'POST', body }).catch(() => undefined);
  }

  private async tokenRequest(params: Record<string, string | undefined>): Promise<TokenPair | null> {
    try {
      const url = `${this.config.KEYCLOAK_ISSUER_URL}/protocol/openid-connect/token`;
      const body = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) body.set(key, value);
      }
      const response = await fetch(url, { method: 'POST', body });
      if (!response.ok) return null;
      const data = (await response.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: 'Bearer',
      };
    } catch {
      return null;
    }
  }
}
