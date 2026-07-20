import type { AppConfig } from '../config/index.js';

/** Stub orchestrator — delegates to Provisioning service (contract only). */
export class ProvisioningOrchestrator {
  constructor(private readonly config: AppConfig) {}

  async provisionTenant(tenantId: string, organizationName: string): Promise<{ jobId: string; note: string }> {
    return {
      jobId: `prov-${tenantId}`,
      note: `Provisioning orchestration stub — would call ${this.config.PROVISIONING_BASE_URL}`,
    };
  }
}

/** Stub — Identity service binding (contract only). */
export class IdentityOrchestrator {
  constructor(private readonly config: AppConfig) {}

  async bindUsers(tenantId: string): Promise<{ note: string }> {
    return { note: `Identity binding stub — would call ${this.config.IDENTITY_BASE_URL}` };
  }
}
