/** @module rules-engine/repository */
import type { Repository } from '../shared/repository.js';
import type { GovernanceRuleId, OrganizationId } from '../shared/identifiers.js';
import type { GovernanceRule, GovernanceRuleTarget } from './types.js';

export interface GovernanceRuleRepository extends Repository<GovernanceRule, GovernanceRuleId> {
  findAll(organizationId: OrganizationId): Promise<readonly GovernanceRule[]>;
  findByAppliesTo(organizationId: OrganizationId, appliesTo: GovernanceRuleTarget): Promise<readonly GovernanceRule[]>;
}
