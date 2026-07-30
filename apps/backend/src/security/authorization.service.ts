/**
 * Authorization abstraction — a thin façade over `packages/api-gateway`'s
 * real `AuthorizationEngine`. Policy evaluation logic is not
 * reimplemented here; this only narrows the gateway's real policy
 * engine down to what a caller actually needs, per the platform's
 * Relationship Layer convention (`docs/adr/0005`).
 */
import { Injectable } from '@nestjs/common';
import type {
  AuthorizationEngine,
  CreatePolicyInput,
  Policy,
  PolicyDecision,
  PolicyEvaluationInput,
} from '@lateen-os/api-gateway';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class AuthorizationService {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private engine(): AuthorizationEngine | undefined {
    return this.registry.get<{ authorization: AuthorizationEngine }>('api-gateway')?.authorization;
  }

  isAvailable(): boolean {
    return this.engine() !== undefined;
  }

  async evaluate(
    organizationId: string,
    input: PolicyEvaluationInput,
  ): Promise<PolicyDecision | null> {
    const engine = this.engine();
    if (!engine) return null;
    return engine.evaluate(organizationId, input);
  }

  /** Registers a real policy with the gateway's own Policy Evaluation engine — used by the RBAC seed so `evaluate()` has real decisions to make, never a locally reimplemented match. */
  async createPolicy(organizationId: string, input: CreatePolicyInput): Promise<Policy | null> {
    const engine = this.engine();
    if (!engine) return null;
    return engine.createPolicy(organizationId, input);
  }
}
