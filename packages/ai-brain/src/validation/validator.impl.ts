/**
 * Real plan validation — deterministic, rule-based checks across
 * permission, policy, and business dimensions. No live policy engine is
 * wired yet, so checks operate on what the plan and request structurally
 * guarantee.
 *
 * @module validation/validator.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { PlanValidator, ValidationInput } from './validator.js';
import type { BusinessValidation, PermissionValidation, PlanValidationResult, PolicyValidation } from './types.js';

/** Creates a deterministic {@link PlanValidator}. */
export function createPlanValidator(): PlanValidator {
  return {
    async validate(input: ValidationInput): Promise<PlanValidationResult> {
      const { plan, actorId } = input;

      const permission: PermissionValidation = actorId
        ? { status: 'passed', checkedPermissions: ['actor_present'], violations: [], actorId }
        : {
            status: 'warning',
            checkedPermissions: ['actor_present'],
            violations: ['No actor was identified for this session.'],
          };

      const policyViolations: string[] = [];
      if (!plan.summary.trim()) policyViolations.push('Plan is missing a summary.');
      const policy: PolicyValidation = {
        status: policyViolations.length > 0 ? 'failed' : 'passed',
        checkedPolicies: ['plan_has_summary'],
        violations: policyViolations,
      };

      const businessViolations: string[] = [];
      const businessWarnings: string[] = [];
      if (plan.graph.nodes.length === 0) businessViolations.push('Execution graph has no nodes.');
      if (!plan.missionPlan && plan.workflowPlans.length === 0 && plan.workerPlans.length === 0) {
        businessViolations.push('Plan has no mission, workflow, or worker target.');
      }
      if (plan.workerPlans.some((workerPlan) => workerPlan.role === 'generalist')) {
        businessWarnings.push('Plan falls back to a generalist worker — no specialized runtime agent was available.');
      }
      const business: BusinessValidation = {
        status: businessViolations.length > 0 ? 'failed' : businessWarnings.length > 0 ? 'warning' : 'passed',
        checkedRules: ['graph_has_nodes', 'plan_has_target'],
        violations: businessViolations,
        warnings: businessWarnings,
      };

      const approved = permission.status !== 'failed' && policy.status !== 'failed' && business.status !== 'failed';

      return {
        id: generateId('validation-result'),
        organizationId: input.organizationId,
        planId: plan.id,
        permission,
        policy,
        business,
        approved,
        validatedAt: nowIso(),
      };
    },
  };
}
