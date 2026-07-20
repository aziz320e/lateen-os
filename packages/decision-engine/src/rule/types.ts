/** @module rule/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionRuleId, OrganizationId } from '../shared/identifiers.js';

export type { DecisionRuleId };

export type DecisionRuleStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type DecisionRuleKind = 'business' | 'technical' | 'compliance';

/** Base decision rule — evaluated during decision processing. */
export interface DecisionRule extends TenantAuditableEntity<DecisionRuleId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly kind: DecisionRuleKind;
  readonly expression?: string;
  readonly status: DecisionRuleStatus;
  readonly priority: number;
}

/** Business rule — operational or commercial constraint. */
export interface BusinessRule extends DecisionRule {
  readonly kind: 'business';
}

/** Technical rule — system or capability constraint. */
export interface TechnicalRule extends DecisionRule {
  readonly kind: 'technical';
}

/** Compliance rule — regulatory or policy-mandated constraint. */
export interface ComplianceRule extends DecisionRule {
  readonly kind: 'compliance';
  readonly regulationRef?: string;
}

export type { OrganizationId };
