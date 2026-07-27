/**
 * Real Model Governance service — approved/blocked/deprecated model
 * lifecycle plus version tracking, keyed one record per model id.
 *
 * @module model-governance/service.impl
 */
import { InvalidModelTransitionError, ModelGovernanceRecordNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ModelGovernanceRecordRepository } from './repository.js';
import type { ModelGovernanceRecord, ModelGovernanceStatus } from './types.js';

const MODEL_TRANSITIONS: Readonly<Record<ModelGovernanceStatus, readonly ModelGovernanceStatus[]>> = {
  approved: ['blocked', 'deprecated'],
  blocked: ['approved'],
  deprecated: ['blocked'],
};

/** Whether a model governance record may transition from one status to another. */
export function canTransitionModel(from: ModelGovernanceStatus, to: ModelGovernanceStatus): boolean {
  return MODEL_TRANSITIONS[from].includes(to);
}

export interface ApproveModelInput {
  readonly modelId: string;
  readonly modelVersion?: string;
  readonly reason?: string;
}

export interface DeprecateModelInput {
  readonly reason?: string;
  readonly supersededByModelId?: string;
}

export interface ModelGovernanceService {
  approveModel(organizationId: OrganizationId, input: ApproveModelInput): Promise<ModelGovernanceRecord>;
  blockModel(organizationId: OrganizationId, modelId: string, reason?: string): Promise<ModelGovernanceRecord>;
  deprecateModel(organizationId: OrganizationId, modelId: string, input?: DeprecateModelInput): Promise<ModelGovernanceRecord>;
  trackVersion(organizationId: OrganizationId, modelId: string, modelVersion: string): Promise<ModelGovernanceRecord>;
  get(organizationId: OrganizationId, modelId: string): Promise<ModelGovernanceRecord | null>;
  listByStatus(organizationId: OrganizationId, status: ModelGovernanceStatus): Promise<readonly ModelGovernanceRecord[]>;
}

/** Creates a real {@link ModelGovernanceService} backed by a {@link ModelGovernanceRecordRepository}. */
export function createModelGovernanceService(
  repository: ModelGovernanceRecordRepository,
  now: () => string = nowIso,
): ModelGovernanceService {
  async function requireRecord(organizationId: OrganizationId, modelId: string): Promise<ModelGovernanceRecord> {
    const record = await repository.findByModelId(organizationId, modelId);
    if (!record) throw new ModelGovernanceRecordNotFoundError(modelId);
    return record;
  }

  return {
    async approveModel(organizationId, input) {
      const existing = await repository.findByModelId(organizationId, input.modelId);
      const timestamp = now();
      if (!existing) {
        const record: ModelGovernanceRecord = {
          id: generateId('model-governance-record'),
          organizationId,
          createdAt: timestamp,
          updatedAt: timestamp,
          modelId: input.modelId,
          modelVersion: input.modelVersion,
          status: 'approved',
          reason: input.reason,
        };
        await repository.save(record);
        return record;
      }
      if (!canTransitionModel(existing.status, 'approved')) {
        throw new InvalidModelTransitionError(input.modelId, existing.status, 'approved');
      }
      const updated: ModelGovernanceRecord = {
        ...existing,
        status: 'approved',
        modelVersion: input.modelVersion ?? existing.modelVersion,
        reason: input.reason,
        updatedAt: timestamp,
      };
      await repository.save(updated);
      return updated;
    },

    async blockModel(organizationId, modelId, reason) {
      const record = await requireRecord(organizationId, modelId);
      if (!canTransitionModel(record.status, 'blocked')) {
        throw new InvalidModelTransitionError(modelId, record.status, 'blocked');
      }
      const updated: ModelGovernanceRecord = { ...record, status: 'blocked', reason, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async deprecateModel(organizationId, modelId, input) {
      const record = await requireRecord(organizationId, modelId);
      if (!canTransitionModel(record.status, 'deprecated')) {
        throw new InvalidModelTransitionError(modelId, record.status, 'deprecated');
      }
      const updated: ModelGovernanceRecord = {
        ...record,
        status: 'deprecated',
        reason: input?.reason,
        supersededByModelId: input?.supersededByModelId,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async trackVersion(organizationId, modelId, modelVersion) {
      const record = await requireRecord(organizationId, modelId);
      const updated: ModelGovernanceRecord = { ...record, modelVersion, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, modelId) {
      return repository.findByModelId(organizationId, modelId);
    },

    async listByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
