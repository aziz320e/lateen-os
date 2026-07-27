/** @module model-governance/repository */
import type { Repository } from '../shared/repository.js';
import type { ModelGovernanceRecordId, OrganizationId } from '../shared/identifiers.js';
import type { ModelGovernanceRecord, ModelGovernanceStatus } from './types.js';

export interface ModelGovernanceRecordRepository extends Repository<ModelGovernanceRecord, ModelGovernanceRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly ModelGovernanceRecord[]>;
  findByModelId(organizationId: OrganizationId, modelId: string): Promise<ModelGovernanceRecord | null>;
  findByStatus(organizationId: OrganizationId, status: ModelGovernanceStatus): Promise<readonly ModelGovernanceRecord[]>;
}
