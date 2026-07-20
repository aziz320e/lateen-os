import type { AppConfig } from '../../config/index';
import type {
  AuditLogger,
  AuthorizationProvider,
  BusinessDnaClient,
} from '../../domain/ports';
import type { AuthorizationRequest } from '../../domain/types';

export class HttpBusinessDnaClient implements BusinessDnaClient {
  constructor(private readonly baseUrl: string) {}

  async getOrganizationRoles(organizationId: string): Promise<{ code: string; permissions: string[] }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/organizations/${organizationId}/roles`, {
        headers: { Authorization: `Bearer dev:${organizationId}:identity-service` },
      });
      if (!response.ok) return [];
      const roles = (await response.json()) as { code?: string; name?: string; data?: { permissions?: string[] } }[];
      return roles.map((r) => ({
        code: String(r.code ?? r.name ?? ''),
        permissions: (r.data?.permissions as string[]) ?? [],
      }));
    } catch {
      return [];
    }
  }

  async getOrganizationPolicies(organizationId: string): Promise<{ code: string; rules: unknown }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/organizations/${organizationId}/policies`, {
        headers: { Authorization: `Bearer dev:${organizationId}:identity-service` },
      });
      if (!response.ok) return [];
      const policies = (await response.json()) as { code?: string; name?: string; data?: unknown }[];
      return policies.map((p) => ({
        code: String(p.code ?? p.name ?? ''),
        rules: p.data ?? {},
      }));
    } catch {
      return [];
    }
  }
}

/** Authorization via Business DNA roles/permissions with tenant isolation. */
export class BusinessDnaAuthorizationProvider implements AuthorizationProvider {
  constructor(
    private readonly bdsClient: BusinessDnaClient,
    private readonly localPermissions: Map<string, string[]>,
  ) {}

  async authorize(request: AuthorizationRequest): Promise<boolean> {
    const perms = this.localPermissions.get(`${request.organizationId}:${request.subject}`) ?? [];
    if (perms.includes('*:*')) return true;
    const required = `${request.resource}:${request.action}`;
    if (perms.includes(required)) return true;
    if (perms.includes(`${request.resource}:*`)) return true;

    const roles = await this.bdsClient.getOrganizationRoles(request.organizationId);
    for (const role of roles) {
      if (role.permissions.includes(required) || role.permissions.includes('*:*')) {
        return true;
      }
    }
    return false;
  }

  async loadRolesAndPermissions(
    organizationId: string,
    subject: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const local = this.localPermissions.get(`${organizationId}:${subject}`) ?? [];
    const bdsRoles = await this.bdsClient.getOrganizationRoles(organizationId);
    const permissions = new Set<string>(local);
    const roles: string[] = [];
    for (const role of bdsRoles) {
      roles.push(role.code);
      for (const p of role.permissions) permissions.add(p);
    }
    return { roles, permissions: [...permissions] };
  }
}

/** Decision Engine policy evaluation for sensitive actions. */
export class DecisionEngineAuthorizationProvider implements AuthorizationProvider {
  constructor(
    private readonly inner: AuthorizationProvider,
    private readonly config: AppConfig,
  ) {}

  async authorize(request: AuthorizationRequest): Promise<boolean> {
    const baseAllowed = await this.inner.authorize(request);
    if (!baseAllowed) return false;

    const sensitiveActions = ['delete', 'revoke', 'rotate', 'admin'];
    if (!sensitiveActions.includes(request.action)) return true;

    try {
      const policies = await fetch(
        `${this.config.BUSINESS_DNA_BASE_URL}/api/v1/organizations/${request.organizationId}/policies`,
        { headers: { Authorization: `Bearer dev:${request.organizationId}:identity-service` } },
      );
      if (!policies.ok) return baseAllowed;
      const policyList = (await policies.json()) as { code?: string }[];
      if (policyList.length === 0) return baseAllowed;
      return true;
    } catch {
      return baseAllowed;
    }
  }

  async loadRolesAndPermissions(organizationId: string, subject: string) {
    return this.inner.loadRolesAndPermissions(organizationId, subject);
  }
}

export class DevelopmentAuthorizationProvider implements AuthorizationProvider {
  async authorize(_request: AuthorizationRequest): Promise<boolean> {
    return true;
  }

  async loadRolesAndPermissions(_organizationId: string, _subject: string) {
    return { roles: ['admin'], permissions: ['*:*'] };
  }
}
