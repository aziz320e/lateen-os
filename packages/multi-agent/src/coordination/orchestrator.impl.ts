/**
 * Real Collaboration Orchestrator — implements the pre-existing
 * `CollaborationOrchestrator` port. Builds a coordination plan from a
 * mission's team, advances steps through a real state progression
 * (pending -> ready -> running -> completed), genuinely starting a real
 * Workflow Engine instance at the ready -> running transition when a
 * `WorkflowRuntime` and a step-to-definition mapping are injected, and
 * escalates through the real Escalation service (which itself may consult
 * AI Brain).
 *
 * @module coordination/orchestrator.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { WorkflowDefinitionId, WorkflowRuntime } from '@lateen-os/workflow-engine';
import type { EscalationService } from '../escalation/service.impl.js';
import type { MissionMemberRepository, MissionTeamRepository } from '../team/repository.js';
import type { MissionLifecycle } from '../mission/lifecycle.impl.js';
import type { ExecutionService } from '../execution/service.impl.js';
import type { ExecutionStageStatus } from '../execution/types.js';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import type {
  CoordinationPlanRepository,
  CoordinationStepRepository,
  CoordinatorRepository,
} from './repository.js';
import type { CollaborationOrchestrator, CoordinationStep, CoordinationStepId, CoordinationStepStatus } from './types.js';

export interface CollaborationOrchestratorDeps {
  readonly coordinatorRepository: CoordinatorRepository;
  readonly planRepository: CoordinationPlanRepository;
  readonly stepRepository: CoordinationStepRepository;
  readonly teamRepository: MissionTeamRepository;
  readonly memberRepository: MissionMemberRepository;
  readonly missionLifecycle: MissionLifecycle;
  readonly escalationService: EscalationService;
  readonly executionService: ExecutionService;
  /** Real ai-runtime-adjacent workflow-engine collaborator. */
  readonly workflowRuntime?: Pick<WorkflowRuntime, 'startWorkflow'>;
  readonly workflowDefinitionIdForStep?: (step: CoordinationStep) => WorkflowDefinitionId | undefined;
  readonly eventBus?: CollaborationEventBus;
  readonly now?: () => string;
}

function mapStepStatusToStageStatus(status: CoordinationStepStatus): ExecutionStageStatus {
  switch (status) {
    case 'completed':
    case 'failed':
    case 'skipped':
      return status;
    case 'running':
      return 'running';
    default:
      return 'pending';
  }
}

/** Creates a real {@link CollaborationOrchestrator}. */
export function createCollaborationOrchestrator(deps: CollaborationOrchestratorDeps): CollaborationOrchestrator {
  const now = deps.now ?? nowIso;

  return {
    async startMission(organizationId: OrganizationId, missionId: MissionId) {
      const team = await deps.teamRepository.findByMission(organizationId, missionId);
      if (!team) throw new NotFoundError('MissionTeam', missionId);
      const members = await deps.memberRepository.findByTeam(organizationId, team.id);

      const timestamp = now();
      const steps: CoordinationStep[] = members.map((member, index) => ({
        id: generateId('coordination-step'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        planId: '', // filled in below once the plan id is known
        sequence: index + 1,
        title: `${member.role.role} contribution`,
        assignedRole: member.role.role,
        assignedWorkerId: member.workerId,
        status: index === 0 ? 'ready' : 'pending',
        dependsOnStepIds: [],
      }));

      const plan = {
        id: generateId('coordination-plan'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        missionId,
        name: `${team.name} coordination plan`,
        stepIds: steps.map((step) => step.id),
        active: true,
      };

      const linkedSteps = steps.map((step, index) => ({
        ...step,
        planId: plan.id,
        dependsOnStepIds: index === 0 ? [] : [steps[index - 1]!.id],
      }));
      for (const step of linkedSteps) await deps.stepRepository.save(step);
      await deps.planRepository.save(plan);

      const existingCoordinator = await deps.coordinatorRepository.findByMission(organizationId, missionId);
      const coordinator = {
        id: existingCoordinator?.id ?? generateId('coordinator'),
        organizationId,
        createdAt: existingCoordinator?.createdAt ?? timestamp,
        updatedAt: timestamp,
        missionId,
        workerId: team.leader.workerId,
        role: team.leader.role,
        planId: plan.id,
        active: true,
      };
      await deps.coordinatorRepository.save(coordinator);

      await deps.missionLifecycle.start(organizationId, missionId);

      return plan.id;
    },

    async assignWorker(organizationId: OrganizationId, _missionId: MissionId, workerId: WorkerId, stepId: CoordinationStepId) {
      const step = await deps.stepRepository.findById(organizationId, stepId);
      if (!step) throw new NotFoundError('CoordinationStep', stepId);
      await deps.stepRepository.save({ ...step, assignedWorkerId: workerId, updatedAt: now() });
    },

    async advanceStep(organizationId: OrganizationId, stepId: CoordinationStepId): Promise<CoordinationStepStatus> {
      const step = await deps.stepRepository.findById(organizationId, stepId);
      if (!step) throw new NotFoundError('CoordinationStep', stepId);
      if (step.status === 'completed' || step.status === 'failed' || step.status === 'skipped') {
        return step.status;
      }

      if (step.dependsOnStepIds.length > 0) {
        const dependencies = await Promise.all(step.dependsOnStepIds.map((id) => deps.stepRepository.findById(organizationId, id)));
        if (dependencies.some((dependency) => !dependency || dependency.status !== 'completed')) {
          return step.status; // waiting on a predecessor — a normal, non-error state
        }
      }

      if (step.status === 'pending') {
        await deps.stepRepository.save({ ...step, status: 'ready', updatedAt: now() });
        return 'ready';
      }

      if (step.status === 'ready') {
        if (deps.workflowRuntime && !step.workflowInstanceId) {
          const definitionId = deps.workflowDefinitionIdForStep?.(step);
          if (definitionId) {
            const instance = await deps.workflowRuntime.startWorkflow({
              organizationId,
              definitionId,
              startedBy: step.assignedWorkerId,
              correlationId: step.id,
            });
            const status: CoordinationStepStatus = instance.status === 'completed' ? 'completed' : instance.status === 'failed' ? 'failed' : 'running';
            await deps.stepRepository.save({ ...step, workflowInstanceId: instance.id, status, updatedAt: now() });
            deps.eventBus?.publish('coordination_step.advanced', { stepId, status });
            return status;
          }
        }
        await deps.stepRepository.save({ ...step, status: 'running', updatedAt: now() });
        deps.eventBus?.publish('coordination_step.advanced', { stepId, status: 'running' });
        return 'running';
      }

      await deps.stepRepository.save({ ...step, status: 'completed', updatedAt: now() });
      deps.eventBus?.publish('coordination_step.advanced', { stepId, status: 'completed' });
      return 'completed';
    },

    async escalate(organizationId: OrganizationId, missionId: MissionId, reason: string) {
      const coordinator = await deps.coordinatorRepository.findByMission(organizationId, missionId);
      const request = await deps.escalationService.raise(
        organizationId,
        missionId,
        reason,
        'team_lead',
        'ceo_ai',
        coordinator?.workerId ?? ('unknown' as WorkerId),
      );
      deps.eventBus?.publish('mission.escalated', { missionId, reason });
      return request.id;
    },

    async completeMission(organizationId: OrganizationId, missionId: MissionId) {
      const plan = await deps.planRepository.findByMission(organizationId, missionId);
      const steps = plan ? await deps.stepRepository.findByPlan(organizationId, plan.id) : [];
      const success = steps.length > 0 && steps.every((step) => step.status === 'completed' || step.status === 'skipped');

      const execution = await deps.executionService.finalize(
        organizationId,
        missionId,
        steps.map((step) => ({ name: step.title, status: mapStepStatusToStageStatus(step.status) })),
        success,
        success ? 'Mission completed — every coordination step resolved.' : 'Mission ended with unresolved or failed coordination steps.',
      );

      if (success) {
        await deps.missionLifecycle.complete(organizationId, missionId);
      } else {
        await deps.missionLifecycle.fail(organizationId, missionId);
      }

      return execution.id;
    },
  };
}
