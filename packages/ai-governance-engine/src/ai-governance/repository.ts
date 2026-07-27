/** @module ai-governance/repository */
import type { Repository } from '../shared/repository.js';
import type { AiGovernanceRecordId, OrganizationId } from '../shared/identifiers.js';
import type { AiGovernanceRecord, AiGovernanceTargetType } from './types.js';

export interface AiGovernanceRecordRepository extends Repository<AiGovernanceRecord, AiGovernanceRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly AiGovernanceRecord[]>;
  findByTargetType(organizationId: OrganizationId, targetType: AiGovernanceTargetType): Promise<readonly AiGovernanceRecord[]>;
  findByTarget(organizationId: OrganizationId, targetType: AiGovernanceTargetType, targetId: string): Promise<AiGovernanceRecord | null>;
}
