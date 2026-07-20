/**
 * Plan validation port.
 *
 * @module validation/validator
 */

import type { ExecutionPlan } from '../planner/types.js';
import type { EnterpriseContext } from '../context/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { PlanValidationResult } from './types.js';

/** Input for validating an execution plan. */
export interface ValidationInput {
  readonly organizationId: OrganizationId;
  readonly plan: ExecutionPlan;
  readonly context: EnterpriseContext;
  readonly actorId?: string;
}

/** Port for validating plans against permissions, policies, and business rules. */
export interface PlanValidator {
  validate(input: ValidationInput): Promise<PlanValidationResult>;
}
