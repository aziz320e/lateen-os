/** @module policy/repository */
import type { Repository } from '../shared/repository.js';
import type { GovernancePolicyId, OrganizationId, PolicyVersionId } from '../shared/identifiers.js';
import type { GovernancePolicy, GovernancePolicyStatus, GovernancePolicyType, GovernancePolicyVersion } from './types.js';

export interface GovernancePolicyRepository extends Repository<GovernancePolicy, GovernancePolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly GovernancePolicy[]>;
  findByType(organizationId: OrganizationId, policyType: GovernancePolicyType): Promise<readonly GovernancePolicy[]>;
  findByStatus(organizationId: OrganizationId, status: GovernancePolicyStatus): Promise<readonly GovernancePolicy[]>;
}

export interface GovernancePolicyVersionRepository extends Repository<GovernancePolicyVersion, PolicyVersionId> {
  findByPolicyId(organizationId: OrganizationId, policyId: GovernancePolicyId): Promise<readonly GovernancePolicyVersion[]>;
}
