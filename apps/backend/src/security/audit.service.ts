/**
 * Audit abstraction — a thin façade over `packages/ai-security-engine`'s
 * real `AuditService`. Every authentication and authorization event this
 * host records (login, logout, refresh, denied access) is written
 * through the engine's own real, immutable audit sink — nothing here
 * reimplements audit storage or the Access History / Violations views.
 */
import { Injectable } from '@nestjs/common';
import type {
  AuditCategory,
  AuditEvent,
  AuditOutcome,
  AuditService as SecurityAuditService,
} from '@lateen-os/ai-security-engine';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

export interface RecordAuthEventInput {
  readonly category: AuditCategory;
  readonly action: string;
  readonly actorId?: string;
  readonly outcome: AuditOutcome;
  readonly details?: Readonly<Record<string, unknown>>;
}

@Injectable()
export class AuditService {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private engine(): SecurityAuditService | undefined {
    return this.registry.get<{ audit: SecurityAuditService }>('ai-security-engine')?.audit;
  }

  isAvailable(): boolean {
    return this.engine() !== undefined;
  }

  async record(organizationId: string, input: RecordAuthEventInput): Promise<AuditEvent | null> {
    const engine = this.engine();
    if (!engine) return null;
    return engine.record(organizationId, input);
  }
}
