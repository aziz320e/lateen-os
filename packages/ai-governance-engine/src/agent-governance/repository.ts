/** @module agent-governance/repository */
import type { Repository } from '../shared/repository.js';
import type { AgentGovernanceRecordId, OrganizationId } from '../shared/identifiers.js';
import type { AgentGovernanceRecord, AgentGovernanceStatus } from './types.js';

export interface AgentGovernanceRecordRepository extends Repository<AgentGovernanceRecord, AgentGovernanceRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly AgentGovernanceRecord[]>;
  findByRuntimeAgentId(organizationId: OrganizationId, runtimeAgentId: string): Promise<AgentGovernanceRecord | null>;
  findByStatus(organizationId: OrganizationId, status: AgentGovernanceStatus): Promise<readonly AgentGovernanceRecord[]>;
}
