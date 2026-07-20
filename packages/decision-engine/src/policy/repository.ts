/** @module policy/repository */
import type { DecisionPolicyId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DecisionPolicy, DecisionPolicyStatus } from './types.js';

export interface DecisionPolicyRepository extends Repository<DecisionPolicy, DecisionPolicyId> {
  findByCode(organizationId: OrganizationId, code: string): Promise<DecisionPolicy | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: DecisionPolicyStatus,
  ): Promise<readonly DecisionPolicy[]>;
}
