/**
 * Real AI Governance service — a lightweight, deterministic governance
 * ledger over the six AI target kinds (providers, models, agents,
 * workers, brain, runtime). One active record per (targetType,
 * targetId); calling `approve`/`block`/`restrict` again re-decides the
 * same record rather than accumulating history — the richer,
 * lifecycle-aware registers for models and agents live in their own
 * modules.
 *
 * @module ai-governance/service.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { AiGovernanceRecordRepository } from './repository.js';
import type { AiGovernanceRecord, AiGovernanceStatus, AiGovernanceTargetType } from './types.js';

export interface DecideAiGovernanceInput {
  readonly targetType: AiGovernanceTargetType;
  readonly targetId: string;
  readonly reason?: string;
}

export interface AiGovernanceService {
  approve(organizationId: OrganizationId, input: DecideAiGovernanceInput): Promise<AiGovernanceRecord>;
  block(organizationId: OrganizationId, input: DecideAiGovernanceInput): Promise<AiGovernanceRecord>;
  restrict(organizationId: OrganizationId, input: DecideAiGovernanceInput): Promise<AiGovernanceRecord>;
  /** `null` means ungoverned — no governance decision has been recorded for this target. */
  getStatus(organizationId: OrganizationId, targetType: AiGovernanceTargetType, targetId: string): Promise<AiGovernanceStatus | null>;
  listByTargetType(organizationId: OrganizationId, targetType: AiGovernanceTargetType): Promise<readonly AiGovernanceRecord[]>;
}

/** Creates a real {@link AiGovernanceService} backed by an {@link AiGovernanceRecordRepository}. */
export function createAiGovernanceService(
  repository: AiGovernanceRecordRepository,
  now: () => string = nowIso,
): AiGovernanceService {
  async function decide(organizationId: OrganizationId, status: AiGovernanceStatus, input: DecideAiGovernanceInput): Promise<AiGovernanceRecord> {
    const existing = await repository.findByTarget(organizationId, input.targetType, input.targetId);
    const timestamp = now();
    const record: AiGovernanceRecord = existing
      ? { ...existing, status, reason: input.reason, updatedAt: timestamp }
      : {
          id: generateId('ai-governance-record'),
          organizationId,
          createdAt: timestamp,
          updatedAt: timestamp,
          targetType: input.targetType,
          targetId: input.targetId,
          status,
          reason: input.reason,
        };
    await repository.save(record);
    return record;
  }

  return {
    approve: (organizationId, input) => decide(organizationId, 'approved', input),
    block: (organizationId, input) => decide(organizationId, 'blocked', input),
    restrict: (organizationId, input) => decide(organizationId, 'restricted', input),

    async getStatus(organizationId, targetType, targetId) {
      const record = await repository.findByTarget(organizationId, targetType, targetId);
      return record?.status ?? null;
    },

    async listByTargetType(organizationId, targetType) {
      return repository.findByTargetType(organizationId, targetType);
    },
  };
}
