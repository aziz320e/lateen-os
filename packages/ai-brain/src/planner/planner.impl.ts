/**
 * Real plan synthesis — deterministic. Turns a {@link RoutingDecision} into
 * a structured {@link ExecutionPlan}: mission/workflow/worker plan entries
 * plus an execution graph (a leading validation checkpoint, one node per
 * routed target, and sequential edges between them).
 *
 * @module planner/planner.impl
 */
import type {
  ExecutionCheckpoint,
  ExecutionEdge,
  ExecutionGraph,
  ExecutionNode,
  ExecutionNodeKind,
} from '../execution-plan/types.js';
import { generateId, nowIso } from '../shared/id.js';
import type { BrainPlanner, PlanningInput } from './planner.js';
import type { ExecutionPlan, MissionPlan, WorkerPlan, WorkflowPlan } from './types.js';

function priorityFor(confidenceScore: string): MissionPlan['priority'] {
  const score = Number(confidenceScore);
  if (score >= 0.85) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

/** Creates a deterministic {@link BrainPlanner}. */
export function createBrainPlanner(): BrainPlanner {
  return {
    async createPlan(input: PlanningInput): Promise<ExecutionPlan> {
      const { organizationId, intent, routing } = input;
      const now = nowIso();
      const planId = generateId('execution-plan');

      const missionRoute = routing.missionRoutes[0];
      const missionPlan: MissionPlan | undefined = missionRoute
        ? {
            id: generateId('mission-plan'),
            organizationId,
            createdAt: now,
            updatedAt: now,
            planId,
            missionType: missionRoute.missionType,
            objective: intent.summary,
            priority: priorityFor(intent.confidence.score),
            rationale: missionRoute.rationale,
          }
        : undefined;

      const workflowPlans: WorkflowPlan[] = routing.workflowRoutes.map((route) => ({
        id: generateId('workflow-plan'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        planId,
        workflowDefinitionId: route.workflowDefinitionId,
        trigger: route.trigger,
        rationale: route.rationale,
      }));

      const workerPlans: WorkerPlan[] = routing.workerRoutes.map((route) => ({
        id: generateId('worker-plan'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        planId,
        workerId: route.workerId,
        role: route.role,
        taskSummary: intent.summary,
        skillsRequired: [],
        rationale: route.rationale,
      }));

      const graphId = generateId('execution-graph');

      const actionSpecs: Array<{ readonly kind: ExecutionNodeKind; readonly label: string; readonly targetRef: string }> = [
        ...routing.serviceRoutes.map((route) => ({
          kind: 'service_call' as const,
          label: `Call service: ${route.serviceName}`,
          targetRef: route.id,
        })),
        ...(missionPlan
          ? [{ kind: 'mission_start' as const, label: `Start mission: ${missionPlan.missionType}`, targetRef: missionPlan.id }]
          : []),
        ...workflowPlans.map((plan) => ({
          kind: 'workflow_start' as const,
          label: `Start workflow: ${plan.trigger}`,
          targetRef: plan.id,
        })),
        ...workerPlans.map((plan) => ({
          kind: 'worker_delegate' as const,
          label: `Delegate to worker: ${plan.role}`,
          targetRef: plan.id,
        })),
      ];

      const validationNode: ExecutionNode = {
        id: generateId('execution-node'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        graphId,
        kind: 'validation',
        label: 'Validate plan before execution',
        targetRef: planId,
        status: 'pending',
        order: 0,
      };

      const actionNodes: ExecutionNode[] = actionSpecs.map((spec, index) => ({
        id: generateId('execution-node'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        graphId,
        kind: spec.kind,
        label: spec.label,
        targetRef: spec.targetRef,
        status: 'pending',
        order: index + 1,
      }));

      const nodes: ExecutionNode[] = [validationNode, ...actionNodes];

      const edges: ExecutionEdge[] = nodes.slice(1).map((node, index) => ({
        id: generateId('execution-edge'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        graphId,
        fromNodeId: nodes[index]!.id,
        toNodeId: node.id,
        kind: 'sequential',
      }));

      const checkpoints: ExecutionCheckpoint[] = [
        {
          id: generateId('execution-checkpoint'),
          organizationId,
          createdAt: now,
          updatedAt: now,
          graphId,
          nodeId: validationNode.id,
          label: 'Plan validation gate',
          status: 'pending',
          validationRef: planId,
        },
      ];

      const graph: ExecutionGraph = {
        id: graphId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        label: `Execution graph for plan ${planId}`,
        nodes,
        edges,
        checkpoints,
      };

      const hasAnyRoute = Boolean(missionPlan) || workflowPlans.length > 0 || workerPlans.length > 0;

      return {
        id: planId,
        organizationId,
        createdAt: now,
        updatedAt: now,
        intentId: intent.id,
        status: hasAnyRoute ? 'pending_validation' : 'draft',
        summary: `Plan for "${intent.type}" intent: ${intent.summary}`,
        missionPlan,
        workflowPlans,
        workerPlans,
        graph,
      };
    },
  };
}
