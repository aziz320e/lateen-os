/** @module provider-security/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ProviderPolicyId } from '../shared/identifiers.js';
import type { ProviderSecurityPolicy, ProviderPolicyStatus } from './types.js';

export interface ProviderSecurityPolicyRepository extends Repository<ProviderSecurityPolicy, ProviderPolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly ProviderSecurityPolicy[]>;
  findByStatus(organizationId: OrganizationId, status: ProviderPolicyStatus): Promise<readonly ProviderSecurityPolicy[]>;
}
