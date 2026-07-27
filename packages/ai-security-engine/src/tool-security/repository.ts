/** @module tool-security/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ToolPolicyId } from '../shared/identifiers.js';
import type { ToolPolicy, ToolPolicyStatus } from './types.js';

export interface ToolPolicyRepository extends Repository<ToolPolicy, ToolPolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly ToolPolicy[]>;
  findByStatus(organizationId: OrganizationId, status: ToolPolicyStatus): Promise<readonly ToolPolicy[]>;
}
