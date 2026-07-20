import { randomUUID } from 'node:crypto';
import type { ProvisioningRequest, ProvisioningStepId } from '../domain/types.js';
import { getProfile } from '../profiles/definitions.js';

/** Orchestration ports — stub implementations calling platform services (contracts only). */
export interface OrchestratorContext {
  readonly jobId: string;
  readonly request: ProvisioningRequest;
  readonly organizationId: string;
  readonly tenantId: string;
  readonly adminId: string;
}

export interface StepOrchestratorPort {
  execute(stepId: ProvisioningStepId, ctx: OrchestratorContext): Promise<Record<string, unknown>>;
}

export class StubStepOrchestrator implements StepOrchestratorPort {
  async execute(stepId: ProvisioningStepId, ctx: OrchestratorContext): Promise<Record<string, unknown>> {
    const profile = getProfile(ctx.request.profile);

    switch (stepId) {
      case 'validate-request':
        return { valid: true, profile: ctx.request.profile };
      case 'create-organization':
        return { organizationId: ctx.organizationId, name: ctx.request.organizationName };
      case 'create-tenant':
        return { tenantId: ctx.tenantId };
      case 'create-identity':
        return { identityProvider: 'identity-service', tenantId: ctx.tenantId };
      case 'create-administrator':
        return { adminId: ctx.adminId, email: `admin@${ctx.request.organizationName.toLowerCase().replace(/\s+/g, '-')}.local` };
      case 'install-marketplace-extensions': {
        const extensions = ctx.request.extensions?.length ? ctx.request.extensions : profile.defaultExtensions;
        return { installed: extensions, source: 'marketplace' };
      }
      case 'install-industry-pack':
        return profile.industryPack
          ? { installed: profile.industryPack, source: 'marketplace' }
          : { skipped: true, reason: 'No industry pack for profile' };
      case 'create-business-dna':
        return { organizationId: ctx.organizationId, industry: ctx.request.industry ?? profile.id };
      case 'create-departments':
        return { departments: profile.departments };
      case 'create-roles':
        return { roles: ['admin', 'manager', 'operator'] };
      case 'create-permissions':
        return { permissions: ['read', 'write', 'admin'] };
      case 'create-ai-workforce': {
        const workers = ctx.request.aiWorkers?.length ? ctx.request.aiWorkers : profile.aiWorkers;
        return { workers };
      }
      case 'create-workflows':
        return { workflows: profile.workflows };
      case 'create-dashboards':
        return { dashboards: profile.dashboards };
      case 'create-kpis':
        return { kpis: profile.kpis };
      case 'run-health-checks':
        return { status: 'healthy', services: ['identity', 'business-dna', 'marketplace', 'kernel'] };
      case 'generate-report':
        return {
          jobId: ctx.jobId,
          organizationId: ctx.organizationId,
          tenantId: ctx.tenantId,
          profile: ctx.request.profile,
          generatedAt: new Date().toISOString(),
        };
      default:
        return {};
    }
  }
}

export function createOrchestratorContext(jobId: string, request: ProvisioningRequest): OrchestratorContext {
  return {
    jobId,
    request,
    organizationId: randomUUID(),
    tenantId: randomUUID(),
    adminId: randomUUID(),
  };
}
