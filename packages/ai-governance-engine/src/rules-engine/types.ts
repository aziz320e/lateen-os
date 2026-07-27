/** @module rules-engine/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { GovernanceRuleId } from '../shared/identifiers.js';

export type { GovernanceRuleId };

/** The five kinds of governed context the rules engine can evaluate against. */
export type GovernanceRuleTarget = 'runtime_action' | 'workflow_execution' | 'provider_usage' | 'communication_request' | 'business_operation';

export type GovernanceRuleEffect = 'allow' | 'deny' | 'flag';

export type RuleConditionOperator = 'eq' | 'neq' | 'in';

export interface GovernanceRuleCondition {
  readonly attribute: string;
  readonly operator: RuleConditionOperator;
  readonly value: unknown;
}

export type GovernanceRuleStatus = 'active' | 'archived';

/** A single deterministic governance rule — conditions combine with AND semantics. */
export interface GovernanceRule extends TenantAuditableEntity<GovernanceRuleId> {
  readonly name: string;
  readonly appliesTo: GovernanceRuleTarget;
  readonly conditions: readonly GovernanceRuleCondition[];
  readonly effect: GovernanceRuleEffect;
  readonly status: GovernanceRuleStatus;
}

export interface EvaluateGovernanceInput {
  readonly appliesTo: GovernanceRuleTarget;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface GovernanceEvaluation {
  readonly allowed: boolean;
  readonly matchedRuleId?: string;
  readonly effect?: GovernanceRuleEffect;
  readonly reason?: string;
}
