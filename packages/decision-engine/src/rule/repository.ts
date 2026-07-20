/** @module rule/repository */
import type { DecisionRuleId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DecisionRule, DecisionRuleKind, DecisionRuleStatus } from './types.js';

export interface DecisionRuleRepository extends Repository<DecisionRule, DecisionRuleId> {
  findByCode(organizationId: OrganizationId, code: string): Promise<DecisionRule | null>;
  findByKind(
    organizationId: OrganizationId,
    kind: DecisionRuleKind,
  ): Promise<readonly DecisionRule[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: DecisionRuleStatus,
  ): Promise<readonly DecisionRule[]>;
}
