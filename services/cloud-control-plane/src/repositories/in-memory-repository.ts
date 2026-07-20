import { randomUUID } from 'node:crypto';
import type {
  BackupRecord,
  CloudOverview,
  Deployment,
  Invoice,
  MonitoringStatus,
  Organization,
  Subscription,
  SubscriptionPlan,
  SupportTicket,
  Tenant,
  TenantLifecycleAction,
  TenantStatus,
  UsageSnapshot,
} from '../domain/types.js';

export interface CloudRepositoryPort {
  listOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | null>;
  createOrganization(data: { name: string; slug: string; domain?: string; region?: string }): Promise<Organization>;
  listTenants(organizationId?: string): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | null>;
  createTenant(data: { organizationId: string; name: string; slug: string; plan?: SubscriptionPlan; region?: string }): Promise<Tenant>;
  updateTenantStatus(id: string, status: TenantStatus, plan?: SubscriptionPlan): Promise<Tenant | null>;
  listSubscriptions(tenantId?: string): Promise<Subscription[]>;
  listDeployments(tenantId?: string): Promise<Deployment[]>;
  createDeployment(data: { tenantId: string; environment: string; region: string; version: string }): Promise<Deployment>;
  listInvoices(organizationId?: string): Promise<Invoice[]>;
  listUsage(tenantId?: string): Promise<UsageSnapshot[]>;
  listBackups(tenantId?: string): Promise<BackupRecord[]>;
  listSupportTickets(organizationId?: string): Promise<SupportTicket[]>;
  createSupportTicket(data: { organizationId: string; subject: string; priority?: string }): Promise<SupportTicket>;
  getOverview(): Promise<CloudOverview>;
  listMonitoring(): Promise<MonitoringStatus[]>;
}

function isoNow(): string {
  return new Date().toISOString();
}

export class InMemoryCloudRepository implements CloudRepositoryPort {
  private organizations: Organization[] = [
    { id: 'org-lateen', name: 'Lateen Corp', slug: 'lateen', domain: 'lateen.local', region: 'us', tenantCount: 2, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'org-acme', name: 'Acme Printing', slug: 'acme', domain: 'acme.print', region: 'middle-east', tenantCount: 1, createdAt: '2026-03-15T00:00:00Z' },
  ];

  private tenants: Tenant[] = [
    { id: 'tenant-lateen-prod', organizationId: 'org-lateen', organizationName: 'Lateen Corp', name: 'Production', slug: 'lateen-prod', status: 'active', plan: 'enterprise', region: 'us', createdAt: '2026-01-02T00:00:00Z' },
    { id: 'tenant-lateen-staging', organizationId: 'org-lateen', organizationName: 'Lateen Corp', name: 'Staging', slug: 'lateen-staging', status: 'active', plan: 'professional', region: 'us', createdAt: '2026-02-01T00:00:00Z' },
    { id: 'tenant-acme-prod', organizationId: 'org-acme', organizationName: 'Acme Printing', name: 'Production', slug: 'acme-prod', status: 'active', plan: 'starter', region: 'middle-east', createdAt: '2026-03-16T00:00:00Z' },
  ];

  private subscriptions: Subscription[] = [
    { id: 'sub-1', tenantId: 'tenant-lateen-prod', plan: 'enterprise', status: 'active', startedAt: '2026-01-02T00:00:00Z' },
    { id: 'sub-2', tenantId: 'tenant-acme-prod', plan: 'starter', status: 'active', startedAt: '2026-03-16T00:00:00Z' },
  ];

  private deployments: Deployment[] = [
    { id: 'dep-1', tenantId: 'tenant-lateen-prod', tenantName: 'Production', environment: 'production', region: 'us', version: '1.0.0', status: 'running', deployedAt: '2026-07-01T00:00:00Z' },
    { id: 'dep-2', tenantId: 'tenant-lateen-staging', tenantName: 'Staging', environment: 'staging', region: 'us', version: '1.1.0-beta', status: 'running', deployedAt: '2026-07-15T00:00:00Z' },
  ];

  private invoices: Invoice[] = [
    { id: 'inv-1', organizationId: 'org-lateen', amount: '999.00', currency: 'USD', status: 'paid', periodStart: '2026-07-01', periodEnd: '2026-07-31' },
    { id: 'inv-2', organizationId: 'org-acme', amount: '49.00', currency: 'USD', status: 'open', periodStart: '2026-07-01', periodEnd: '2026-07-31' },
  ];

  private usage: UsageSnapshot[] = [
    { tenantId: 'tenant-lateen-prod', metric: 'users', value: 45, unit: 'count', period: '2026-07' },
    { tenantId: 'tenant-lateen-prod', metric: 'ai-tokens', value: 2_450_000, unit: 'tokens', period: '2026-07' },
    { tenantId: 'tenant-lateen-prod', metric: 'storage', value: 128, unit: 'GB', period: '2026-07' },
    { tenantId: 'tenant-acme-prod', metric: 'users', value: 12, unit: 'count', period: '2026-07' },
  ];

  private backups: BackupRecord[] = [
    { id: 'bak-1', tenantId: 'tenant-lateen-prod', type: 'scheduled', status: 'completed', sizeBytes: 5_400_000_000, verified: true, createdAt: '2026-07-20T02:00:00Z' },
  ];

  private tickets: SupportTicket[] = [
    { id: 'tkt-1', organizationId: 'org-acme', subject: 'Connector sync issue', status: 'open', priority: 'normal', createdAt: '2026-07-19T10:00:00Z' },
  ];

  async listOrganizations() { return [...this.organizations]; }
  async getOrganization(id: string) { return this.organizations.find((o) => o.id === id) ?? null; }

  async createOrganization(data: { name: string; slug: string; domain?: string; region?: string }) {
    const org: Organization = {
      id: randomUUID(),
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      region: (data.region as Organization['region']) ?? 'us',
      tenantCount: 0,
      createdAt: isoNow(),
    };
    this.organizations.push(org);
    return org;
  }

  async listTenants(organizationId?: string) {
    return organizationId ? this.tenants.filter((t) => t.organizationId === organizationId) : [...this.tenants];
  }

  async getTenant(id: string) { return this.tenants.find((t) => t.id === id) ?? null; }

  async createTenant(data: { organizationId: string; name: string; slug: string; plan?: SubscriptionPlan; region?: string }) {
    const org = await this.getOrganization(data.organizationId);
    const tenant: Tenant = {
      id: randomUUID(),
      organizationId: data.organizationId,
      organizationName: org?.name ?? 'Unknown',
      name: data.name,
      slug: data.slug,
      status: 'provisioning',
      plan: data.plan ?? 'community',
      region: (data.region as Tenant['region']) ?? 'us',
      createdAt: isoNow(),
    };
    this.tenants.push(tenant);
    if (org) {
      this.organizations = this.organizations.map((o) =>
        o.id === data.organizationId ? { ...o, tenantCount: o.tenantCount + 1 } : o,
      );
    }
    return tenant;
  }

  async updateTenantStatus(id: string, status: TenantStatus, plan?: SubscriptionPlan) {
    const tenant = this.tenants.find((t) => t.id === id);
    if (!tenant) return null;
    const updated = { ...tenant, status, ...(plan ? { plan } : {}) };
    this.tenants = this.tenants.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  async listSubscriptions(tenantId?: string) {
    return tenantId ? this.subscriptions.filter((s) => s.tenantId === tenantId) : [...this.subscriptions];
  }

  async listDeployments(tenantId?: string) {
    return tenantId ? this.deployments.filter((d) => d.tenantId === tenantId) : [...this.deployments];
  }

  async createDeployment(data: { tenantId: string; environment: string; region: string; version: string }) {
    const tenant = await this.getTenant(data.tenantId);
    const dep: Deployment = {
      id: randomUUID(),
      tenantId: data.tenantId,
      tenantName: tenant?.name ?? 'Unknown',
      environment: data.environment as Deployment['environment'],
      region: data.region as Deployment['region'],
      version: data.version,
      status: 'pending',
    };
    this.deployments.push(dep);
    return dep;
  }

  async listInvoices(organizationId?: string) {
    return organizationId ? this.invoices.filter((i) => i.organizationId === organizationId) : [...this.invoices];
  }

  async listUsage(tenantId?: string) {
    return tenantId ? this.usage.filter((u) => u.tenantId === tenantId) : [...this.usage];
  }

  async listBackups(tenantId?: string) {
    return tenantId ? this.backups.filter((b) => b.tenantId === tenantId) : [...this.backups];
  }

  async listSupportTickets(organizationId?: string) {
    return organizationId ? this.tickets.filter((t) => t.organizationId === organizationId) : [...this.tickets];
  }

  async createSupportTicket(data: { organizationId: string; subject: string; priority?: string }) {
    const ticket: SupportTicket = {
      id: randomUUID(),
      organizationId: data.organizationId,
      subject: data.subject,
      status: 'open',
      priority: data.priority ?? 'normal',
      createdAt: isoNow(),
    };
    this.tickets.push(ticket);
    return ticket;
  }

  async getOverview(): Promise<CloudOverview> {
    return {
      organizations: this.organizations.length,
      tenants: this.tenants.length,
      activeTenants: this.tenants.filter((t) => t.status === 'active').length,
      deployments: this.deployments.length,
      openTickets: this.tickets.filter((t) => t.status === 'open').length,
    };
  }

  async listMonitoring(): Promise<MonitoringStatus[]> {
    return [
      { component: 'tenant-health', status: 'healthy' },
      { component: 'infrastructure', status: 'healthy', latencyMs: 12 },
      { component: 'applications', status: 'healthy' },
      { component: 'services', status: 'degraded', message: 'search-platform indexing' },
      { component: 'workers', status: 'healthy' },
      { component: 'connectors', status: 'healthy' },
      { component: 'storage', status: 'healthy' },
      { component: 'backups', status: 'healthy' },
    ];
  }
}

export function applyLifecycleAction(current: TenantStatus, action: TenantLifecycleAction): TenantStatus {
  const transitions: Record<TenantLifecycleAction, TenantStatus> = {
    provision: 'provisioning',
    activate: 'active',
    suspend: 'suspended',
    resume: 'active',
    upgrade: 'active',
    downgrade: 'active',
    archive: 'archived',
    delete: 'deleted',
  };
  return transitions[action] ?? current;
}
