/** @module validation/types */
import type { ExecutionPlan } from '../planner/types.js';
import type {
  OrganizationId,
  ValidationResultId,
} from '../shared/identifiers.js';

export type { ValidationResultId, OrganizationId };

export type ValidationStatus = 'passed' | 'failed' | 'warning';

/** Permission check against Business DNA roles and policies. */
export interface PermissionValidation {
  readonly status: ValidationStatus;
  readonly checkedPermissions: readonly string[];
  readonly violations: readonly string[];
  readonly actorId?: string;
}

/** Policy check against organizational governance rules. */
export interface PolicyValidation {
  readonly status: ValidationStatus;
  readonly checkedPolicies: readonly string[];
  readonly violations: readonly string[];
}

/** Business rule validation against domain constraints. */
export interface BusinessValidation {
  readonly status: ValidationStatus;
  readonly checkedRules: readonly string[];
  readonly violations: readonly string[];
  readonly warnings: readonly string[];
}

/** Combined validation outcome for an execution plan. */
export interface PlanValidationResult {
  readonly id: ValidationResultId;
  readonly organizationId: OrganizationId;
  readonly planId: string;
  readonly permission: PermissionValidation;
  readonly policy: PolicyValidation;
  readonly business: BusinessValidation;
  readonly approved: boolean;
  readonly validatedAt: string;
}

/** Summary of all validation dimensions. */
export interface ValidationSummary {
  readonly plan: ExecutionPlan;
  readonly result: PlanValidationResult;
}
