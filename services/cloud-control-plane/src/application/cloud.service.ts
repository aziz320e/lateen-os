import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../config/index.js';
import type {
  CloudOverview,
  Deployment,
  Organization,
  PlanDefinition,
  SubscriptionPlan,
  SupportTicket,
  Tenant,
  TenantLifecycleAction,
} from '../domain/types.js';
import { CLOUD_DOMAINS, PLAN_DEFINITIONS, SUBSCRIPTION_PLANS, TENANT_LIFECYCLE_ACTIONS } from '../domain/types.js';
import type { CloudRepositoryPort } from '../repositories/in-memory-repository.js';
import { applyLifecycleAction } from '../repositories/in-memory-repository.js';
import { IdentityOrchestrator, ProvisioningOrchestrator } from '../orchestrators/service-orchestrators.js';

export class CloudService {
  private readonly provisioning: ProvisioningOrchestrator;
  private readonly identity: IdentityOrchestrator;

  constructor(
    private readonly repo: CloudRepositoryPort,
    config: AppConfig,
  ) {
    this.provisioning = new ProvisioningOrchestrator(config);
    this.identity = new IdentityOrchestrator(config);
  }

  async overview(): Promise<CloudOverview> {
    return this.repo.getOverview();
  }

  domains() {
    return { domains: CLOUD_DOMAINS, plans: SUBSCRIPTION_PLANS, lifecycle: TENANT_LIFECYCLE_ACTIONS };
  }

  listPlans(): readonly PlanDefinition[] {
    return PLAN_DEFINITIONS;
  }

  listOrganizations() { return this.repo.listOrganizations(); }
  getOrganization(id: string) { return this.repo.getOrganization(id); }
  createOrganization(data: { name: string; slug: string; domain?: string; region?: string }) {
    return this.repo.createOrganization(data);
  }

  listTenants(organizationId?: string) { return this.repo.listTenants(organizationId); }
  getTenant(id: string) { return this.repo.getTenant(id); }

  async createTenant(data: { organizationId: string; name: string; slug: string; plan?: SubscriptionPlan; region?: string }) {
    const tenant = await this.repo.createTenant(data);
    await this.provisioning.provisionTenant(tenant.id, tenant.organizationName);
    return tenant;
  }

  async applyLifecycle(tenantId: string, action: TenantLifecycleAction, plan?: SubscriptionPlan) {
    const tenant = await this.repo.getTenant(tenantId);
    if (!tenant) return null;
    const status = applyLifecycleAction(tenant.status, action);
    if (action === 'activate') await this.identity.bindUsers(tenantId);
    return this.repo.updateTenantStatus(tenantId, status, plan);
  }

  listSubscriptions(tenantId?: string) { return this.repo.listSubscriptions(tenantId); }
  listDeployments(tenantId?: string) { return this.repo.listDeployments(tenantId); }
  createDeployment(data: { tenantId: string; environment: string; region: string; version: string }) {
    return this.repo.createDeployment(data);
  }

  listBilling(organizationId?: string) { return this.repo.listInvoices(organizationId); }
  listUsage(tenantId?: string) { return this.repo.listUsage(tenantId); }
  listBackups(tenantId?: string) { return this.repo.listBackups(tenantId); }
  listSupport(organizationId?: string) { return this.repo.listSupportTickets(organizationId); }
  createSupport(data: { organizationId: string; subject: string; priority?: string }) {
    return this.repo.createSupportTicket(data);
  }
  listMonitoring() { return this.repo.listMonitoring(); }

  async createPaymentStub(invoiceId: string) {
    return {
      paymentId: randomUUID(),
      invoiceId,
      status: 'stub',
      note: 'No payment gateway implementation — contract only',
    };
  }
}
