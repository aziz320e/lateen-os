/** @module condition/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConditionId, ExpressionId, OrganizationId, RuleId } from '../shared/identifiers.js';

export type { ConditionId, ExpressionId, RuleId };

export type ExpressionLanguage = 'jsonlogic' | 'cel' | 'simple';

/** Evaluated expression against workflow variables. */
export interface Expression extends TenantAuditableEntity<ExpressionId> {
  readonly language: ExpressionLanguage;
  readonly source: string;
  readonly description?: string;
}

/** Named business rule bound to a condition. */
export interface Rule extends TenantAuditableEntity<RuleId> {
  readonly code: string;
  readonly name: string;
  readonly expressionId: ExpressionId;
  readonly active: boolean;
}

/** Policy-aligned condition referencing Decision Engine policy codes. */
export interface PolicyCondition extends TenantAuditableEntity<ConditionId> {
  readonly policyCode: string;
  readonly policyName: string;
  readonly expressionId: ExpressionId;
  readonly failOnViolation: boolean;
}

export type { OrganizationId };
