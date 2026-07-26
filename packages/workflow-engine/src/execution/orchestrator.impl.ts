/**
 * Real Workflow Orchestrator — the Workflow Executor. Coordinates step
 * handoffs, transitions, retries, waits, and compensation. Does not
 * execute business logic itself: a step type with a registered
 * {@link StepHandler} runs automatically (with its retry policy applied);
 * a step type with none stays "active"/"waiting" for an external system
 * to report completion via `dispatch({command: 'complete' | 'fail'})`.
 *
 * @module execution/orchestrator.impl
 */
import type { PolicyConditionRepository } from '../condition/repository.js';
import type { ExpressionRepository } from '../condition/repository.js';
import type { ConditionEvaluator } from '../condition/evaluator.js';
import type { WorkflowEventBus } from '../events/workflow-event-bus.js';
import type { WorkflowExecutionRepository, WorkflowInstanceRepository } from '../instance/repository.js';
import type { WorkflowInstance } from '../instance/types.js';
import type { WorkflowHistoryRepository, ExecutionHistoryRepository } from '../history/repository.js';
import type { HistoryEventType } from '../history/types.js';
import type { StepInstanceRepository } from '../step/repository.js';
import type { StepInstance, StepType, WaitStep, WorkflowStep } from '../step/types.js';
import type { WorkflowVersionRepository } from '../workflow/repository.js';
import type { WorkflowVersion } from '../workflow/types.js';
import {
  NoOutgoingTransitionError,
  StepInstanceNotFoundError,
  WorkflowInstanceNotFoundError,
  WorkflowStepNotFoundError,
  WorkflowVersionNotFoundError,
  WaitNotElapsedError,
} from '../shared/errors.js';
import type { OrganizationId, WorkflowInstanceId, WorkflowStepId } from '../shared/identifiers.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ParallelTransition } from '../transition/types.js';
import { canRetry, runWithRetryPolicy } from './retry.js';
import type { StepHandler, StepHandlerContext } from './step-handler.js';
import { transitionStepInstance, transitionWorkflowInstance } from './state-machine.js';
import { resolveNextSteps } from './transition-resolver.js';
import type { ExecutionCommand, ExecutionHandoff, ExecutionStatus, WorkflowOrchestrator } from './types.js';

const TARGET_BY_TYPE: Readonly<Record<StepType, ExecutionHandoff['target']>> = {
  human: 'human',
  ai: 'ai_worker',
  service: 'service',
  decision: 'decision_engine',
  gateway: 'service',
  subprocess: 'service',
  wait: 'service',
};

export interface WorkflowOrchestratorDeps {
  readonly versionRepository: WorkflowVersionRepository;
  readonly instanceRepository: WorkflowInstanceRepository;
  readonly executionRepository: WorkflowExecutionRepository;
  readonly stepInstanceRepository: StepInstanceRepository;
  readonly workflowHistoryRepository: WorkflowHistoryRepository;
  readonly executionHistoryRepository: ExecutionHistoryRepository;
  readonly policyConditionRepository: PolicyConditionRepository;
  readonly expressionRepository: ExpressionRepository;
  readonly conditionEvaluator: ConditionEvaluator;
  /** Registered per step type. A type with no handler stays active/waiting for an external `dispatch('complete'|'fail')`. */
  readonly stepHandlers?: Partial<Record<StepType, StepHandler>>;
  readonly eventBus?: WorkflowEventBus;
  /** Injectable clock for deterministic tests. Defaults to real time. */
  readonly now?: () => string;
}

function deriveExecutionId(instanceId: WorkflowInstanceId): string {
  return `execution-${instanceId}`;
}

/** Creates a real {@link WorkflowOrchestrator}. */
export function createWorkflowOrchestrator(deps: WorkflowOrchestratorDeps): WorkflowOrchestrator {
  const now = deps.now ?? nowIso;

  // Concurrent parallel branches can complete around the same tick and each
  // want to read-merge-write the same instance's `variables` and re-evaluate
  // join/transition state (see advanceAfterStep). A per-instance chain
  // serializes that critical section so one branch's update is never
  // clobbered by another's stale read, and a join is never triggered twice.
  // Re-entrant as a defensive safety net only — the locked section itself
  // (decideNextAfterStepCompleted) never recurses into another lock
  // acquisition, so this branch should not normally be hit.
  const instanceLocks = new Map<WorkflowInstanceId, Promise<unknown>>();
  const activeInstanceLocks = new Set<WorkflowInstanceId>();
  function withInstanceLock<T>(instanceId: WorkflowInstanceId, fn: () => Promise<T>): Promise<T> {
    if (activeInstanceLocks.has(instanceId)) {
      return fn();
    }
    const runLocked = async (): Promise<T> => {
      activeInstanceLocks.add(instanceId);
      try {
        return await fn();
      } finally {
        activeInstanceLocks.delete(instanceId);
      }
    };
    const prior = instanceLocks.get(instanceId) ?? Promise.resolve();
    const next = prior.then(runLocked, runLocked);
    instanceLocks.set(
      instanceId,
      next.then(
        () => undefined,
        () => undefined,
      ),
    );
    return next;
  }

  async function requireInstance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<WorkflowInstance> {
    const instance = await deps.instanceRepository.findById(organizationId, instanceId);
    if (!instance) throw new WorkflowInstanceNotFoundError(instanceId);
    return instance;
  }

  async function requireVersion(organizationId: OrganizationId, versionId: string): Promise<WorkflowVersion> {
    const version = await deps.versionRepository.findById(organizationId, versionId);
    if (!version) throw new WorkflowVersionNotFoundError(versionId);
    return version;
  }

  function requireStepDef(version: WorkflowVersion, stepId: WorkflowStepId): WorkflowStep {
    const step = version.steps.find((candidate) => candidate.stepId === stepId);
    if (!step) throw new WorkflowStepNotFoundError(stepId, version.id);
    return step;
  }

  async function recordHistory(
    organizationId: OrganizationId,
    instanceId: WorkflowInstanceId,
    eventType: HistoryEventType,
    summary: string,
    stepId?: WorkflowStepId,
    stepInstanceId?: string,
  ): Promise<void> {
    const timestamp = now();
    await deps.workflowHistoryRepository.save({
      id: generateId('workflow-history'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      instanceId,
      eventType,
      stepId,
      stepInstanceId,
      summary,
      occurredAt: timestamp,
    });
  }

  async function recordExecutionHistory(organizationId: OrganizationId, stepInstance: StepInstance): Promise<void> {
    const timestamp = now();
    const startedAtMs = stepInstance.startedAt ? Date.parse(stepInstance.startedAt) : Date.parse(timestamp);
    const completedAtMs = stepInstance.completedAt ? Date.parse(stepInstance.completedAt) : Date.parse(timestamp);
    await deps.executionHistoryRepository.save({
      id: generateId('execution-history'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      instanceId: stepInstance.instanceId,
      stepInstanceId: stepInstance.id,
      stepId: stepInstance.stepId,
      status: stepInstance.status,
      durationMs: Math.max(0, completedAtMs - startedAtMs),
      startedAt: stepInstance.startedAt ?? timestamp,
      completedAt: stepInstance.completedAt,
    });
  }

  async function syncExecution(organizationId: OrganizationId, instance: WorkflowInstance): Promise<void> {
    const executionId = deriveExecutionId(instance.id);
    const active = (await deps.stepInstanceRepository.findByInstanceId(organizationId, instance.id)).filter(
      (stepInstance) => stepInstance.status === 'active' || stepInstance.status === 'waiting',
    );
    const phase =
      instance.status === 'completed' || instance.status === 'failed' || instance.status === 'cancelled'
        ? 'finalizing'
        : active.some((stepInstance) => stepInstance.stepType === 'human')
          ? 'waiting_task'
          : active.some((stepInstance) => stepInstance.stepType === 'decision')
            ? 'waiting_approval'
            : 'executing';
    const timestamp = now();
    const existing = await deps.executionRepository.findById(organizationId, executionId);
    await deps.executionRepository.save({
      id: executionId,
      organizationId,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      instanceId: instance.id,
      phase,
      activeStepInstanceIds: active.map((stepInstance) => stepInstance.id),
      startedAt: existing?.startedAt ?? timestamp,
      errorMessage: instance.status === 'failed' ? existing?.errorMessage : undefined,
    });
  }

  async function findMainStepInstance(
    organizationId: OrganizationId,
    instanceId: WorkflowInstanceId,
    stepId: WorkflowStepId,
  ): Promise<StepInstance | null> {
    const all = await deps.stepInstanceRepository.findByInstanceId(organizationId, instanceId);
    return all.find((stepInstance) => stepInstance.stepId === stepId && !stepInstance.compensationOf) ?? null;
  }

  function findForkContaining(version: WorkflowVersion, stepId: WorkflowStepId): ParallelTransition | undefined {
    return version.transitions.find(
      (transition): transition is ParallelTransition =>
        transition.type === 'parallel' && (transition as ParallelTransition).fork && (transition as ParallelTransition).branchStepIds.includes(stepId),
    );
  }

  async function startStep(
    organizationId: OrganizationId,
    instance: WorkflowInstance,
    version: WorkflowVersion,
    stepId: WorkflowStepId,
  ): Promise<{ stepInstance: StepInstance; handoff: ExecutionHandoff }> {
    const step = requireStepDef(version, stepId);
    const timestamp = now();

    if (step.type === 'wait') {
      const waitStep = step as WaitStep;
      const resumeAt = waitStep.resumeAt ?? new Date(Date.parse(timestamp) + (waitStep.durationMs ?? 0)).toISOString();
      const stepInstance: StepInstance = {
        id: generateId('step-instance'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        instanceId: instance.id,
        stepId,
        stepType: step.type,
        status: 'waiting',
        startedAt: timestamp,
        attempt: 1,
        resumeAt,
      };
      await deps.stepInstanceRepository.save(stepInstance);
      await recordHistory(organizationId, instance.id, 'step_started', `Step "${step.name}" is waiting until ${resumeAt}`, stepId, stepInstance.id);
      deps.eventBus?.publish('step.waiting', { instanceId: instance.id, stepId, waitingFor: resumeAt });
      await syncExecution(organizationId, instance);
      return {
        stepInstance,
        handoff: { instanceId: instance.id, stepInstanceId: stepInstance.id, target: 'service', referenceId: stepInstance.id, status: 'waiting' },
      };
    }

    let stepInstance: StepInstance = {
      id: generateId('step-instance'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      instanceId: instance.id,
      stepId,
      stepType: step.type,
      status: 'active',
      startedAt: timestamp,
      attempt: 1,
    };
    await deps.stepInstanceRepository.save(stepInstance);
    await recordHistory(organizationId, instance.id, 'step_started', `Step "${step.name}" started`, stepId, stepInstance.id);
    deps.eventBus?.publish('step.started', { instanceId: instance.id, stepId, stepType: step.type });
    await syncExecution(organizationId, instance);

    const handler = deps.stepHandlers?.[step.type];
    if (!handler) {
      return {
        stepInstance,
        handoff: {
          instanceId: instance.id,
          stepInstanceId: stepInstance.id,
          target: TARGET_BY_TYPE[step.type],
          referenceId: stepInstance.id,
          status: 'running',
        },
      };
    }

    const policy = step.retryPolicy ?? { maxAttempts: 1, backoff: 'fixed' as const, initialDelayMs: 0 };
    try {
      const { result, attempts } = await runWithRetryPolicy(async (attempt) => {
        const context: StepHandlerContext = { organizationId, instanceId: instance.id, variables: instance.variables, attempt };
        const handlerResult = await handler(step, context);
        if (!handlerResult.success) throw new Error(handlerResult.errorMessage ?? `Step "${step.code}" handler reported failure`);
        return handlerResult;
      }, policy);

      stepInstance = transitionStepInstance({ ...stepInstance, attempt: attempts }, 'completed', now());
      stepInstance = { ...stepInstance, output: result.output };
      await deps.stepInstanceRepository.save(stepInstance);
      await recordHistory(organizationId, instance.id, 'step_completed', `Step "${step.name}" completed`, stepId, stepInstance.id);
      await recordExecutionHistory(organizationId, stepInstance);
      deps.eventBus?.publish('step.completed', { instanceId: instance.id, stepId, stepInstanceId: stepInstance.id });

      await advanceAfterStep(organizationId, instance, version, stepInstance, result.output);

      return {
        stepInstance,
        handoff: { instanceId: instance.id, stepInstanceId: stepInstance.id, target: TARGET_BY_TYPE[step.type], referenceId: stepInstance.id, status: 'completed' },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stepInstance = transitionStepInstance({ ...stepInstance, attempt: policy.maxAttempts }, 'failed', now());
      stepInstance = { ...stepInstance, errorMessage: message };
      await deps.stepInstanceRepository.save(stepInstance);
      await recordHistory(organizationId, instance.id, 'step_failed', `Step "${step.name}" failed: ${message}`, stepId, stepInstance.id);
      await recordExecutionHistory(organizationId, stepInstance);
      deps.eventBus?.publish('step.failed', { instanceId: instance.id, stepId, errorMessage: message });
      await syncExecution(organizationId, instance);
      await onStepFailed(organizationId, instance, version, stepInstance);

      return {
        stepInstance,
        handoff: { instanceId: instance.id, stepInstanceId: stepInstance.id, target: TARGET_BY_TYPE[step.type], referenceId: stepInstance.id, status: 'failed' },
      };
    }
  }

  type Continuation =
    | { readonly kind: 'none' }
    | { readonly kind: 'start'; readonly stepIds: readonly WorkflowStepId[] }
    | { readonly kind: 'complete-instance' };

  /** Pure decision, no recursion — safe to run inside the instance lock. */
  async function decideNextAfterStepCompleted(
    organizationId: OrganizationId,
    instance: WorkflowInstance,
    version: WorkflowVersion,
    stepInstance: StepInstance,
  ): Promise<Continuation> {
    const fork = findForkContaining(version, stepInstance.stepId);
    if (fork) {
      const joinRequiredCount = fork.joinRequiredCount ?? fork.branchStepIds.length;
      const allStepInstances = await deps.stepInstanceRepository.findByInstanceId(organizationId, instance.id);
      const completedBranches = fork.branchStepIds.filter((branchStepId) =>
        allStepInstances.some((candidate) => candidate.stepId === branchStepId && candidate.status === 'completed'),
      ).length;
      if (completedBranches < joinRequiredCount) return { kind: 'none' };

      const joinAlreadyStarted = allStepInstances.some((candidate) => candidate.stepId === fork.toStepId);
      if (joinAlreadyStarted) return { kind: 'none' };

      return { kind: 'start', stepIds: [fork.toStepId] };
    }

    const resolution = await resolveNextSteps(organizationId, stepInstance.stepId, version.transitions, instance.variables, {
      conditionEvaluator: deps.conditionEvaluator,
      policyConditionRepository: deps.policyConditionRepository,
      expressionRepository: deps.expressionRepository,
    });

    if (resolution.kind === 'none') return { kind: 'complete-instance' };
    if (resolution.kind === 'single') return { kind: 'start', stepIds: [resolution.stepId] };
    return { kind: 'start', stepIds: resolution.branchStepIds };
  }

  /**
   * The single entry point every completion/skip/resume path uses: locks
   * the instance, re-fetches its latest state, merges `output` (if any)
   * into its variables, decides what happens next — all inside the lock,
   * with no recursive `startStep` calls — then, once unlocked, acts on
   * that decision. This is what keeps concurrent parallel branches from
   * clobbering each other's variable writes or double-triggering a join.
   */
  async function advanceAfterStep(
    organizationId: OrganizationId,
    instance: WorkflowInstance,
    version: WorkflowVersion,
    stepInstance: StepInstance,
    output?: Readonly<Record<string, unknown>>,
  ): Promise<void> {
    const { continuation, instance: latest } = await withInstanceLock(instance.id, async () => {
      const current = (await deps.instanceRepository.findById(organizationId, instance.id)) ?? instance;
      const merged = output ? { ...current, variables: { ...current.variables, ...output }, updatedAt: now() } : current;
      if (output) await deps.instanceRepository.save(merged);
      await syncExecution(organizationId, merged);

      const continuation = await decideNextAfterStepCompleted(organizationId, merged, version, stepInstance);
      return { continuation, instance: merged };
    });

    if (continuation.kind === 'complete-instance') {
      await completeInstance(organizationId, latest);
    } else if (continuation.kind === 'start') {
      await Promise.all(continuation.stepIds.map((stepId) => startStep(organizationId, latest, version, stepId)));
    }
  }

  async function onStepFailed(
    organizationId: OrganizationId,
    instance: WorkflowInstance,
    version: WorkflowVersion,
    failedStepInstance: StepInstance,
  ): Promise<void> {
    await runCompensation(organizationId, instance, version);
    const failedInstance = transitionWorkflowInstance(instance, 'failed', now());
    await deps.instanceRepository.save(failedInstance);
    await recordHistory(
      organizationId,
      instance.id,
      'instance_failed',
      `Workflow failed at step "${failedStepInstance.stepId}": ${failedStepInstance.errorMessage ?? 'unknown error'}`,
    );
    await syncExecution(organizationId, failedInstance);
    deps.eventBus?.publish('workflow_instance.failed', { instanceId: instance.id, errorMessage: failedStepInstance.errorMessage ?? 'Step failed' });
  }

  async function runCompensation(organizationId: OrganizationId, instance: WorkflowInstance, version: WorkflowVersion): Promise<void> {
    const allStepInstances = await deps.stepInstanceRepository.findByInstanceId(organizationId, instance.id);
    const completedInReverse = allStepInstances
      .filter((stepInstance) => stepInstance.status === 'completed' && !stepInstance.compensationOf && !stepInstance.compensatedAt)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

    for (const completed of completedInReverse) {
      const stepDef = version.steps.find((candidate) => candidate.stepId === completed.stepId);
      if (!stepDef?.compensationStepId) continue;
      const compensationStepDef = version.steps.find((candidate) => candidate.stepId === stepDef.compensationStepId);
      if (!compensationStepDef) continue;

      const timestamp = now();
      let compensationInstance: StepInstance = {
        id: generateId('step-instance'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        instanceId: instance.id,
        stepId: compensationStepDef.stepId,
        stepType: compensationStepDef.type,
        status: 'active',
        startedAt: timestamp,
        attempt: 1,
        compensationOf: completed.stepId,
      };
      await deps.stepInstanceRepository.save(compensationInstance);

      const handler = deps.stepHandlers?.[compensationStepDef.type];
      if (handler) {
        try {
          const result = await handler(compensationStepDef, {
            organizationId,
            instanceId: instance.id,
            variables: instance.variables,
            attempt: 1,
          });
          compensationInstance = transitionStepInstance(compensationInstance, result.success ? 'completed' : 'failed', now());
        } catch {
          compensationInstance = transitionStepInstance(compensationInstance, 'failed', now());
        }
        await deps.stepInstanceRepository.save(compensationInstance);
      }

      const compensatedOriginal: StepInstance = { ...completed, compensatedAt: now(), updatedAt: now() };
      await deps.stepInstanceRepository.save(compensatedOriginal);
      await recordHistory(
        organizationId,
        instance.id,
        'step_compensated',
        `Compensation "${compensationStepDef.name}" executed for step "${completed.stepId}"`,
        compensationStepDef.stepId,
        compensationInstance.id,
      );
      deps.eventBus?.publish('step.compensated', {
        instanceId: instance.id,
        stepId: completed.stepId,
        compensationStepId: compensationStepDef.stepId,
      });
    }
  }

  async function completeInstance(organizationId: OrganizationId, instance: WorkflowInstance): Promise<void> {
    const completed = transitionWorkflowInstance(instance, 'completed', now());
    await deps.instanceRepository.save(completed);
    await recordHistory(organizationId, instance.id, 'instance_completed', 'Workflow completed');
    await syncExecution(organizationId, completed);
    deps.eventBus?.publish('workflow_instance.completed', { instanceId: instance.id });
  }

  async function requireNonTerminalStepInstance(
    organizationId: OrganizationId,
    instanceId: WorkflowInstanceId,
    stepId: WorkflowStepId,
  ): Promise<StepInstance> {
    const stepInstance = await findMainStepInstance(organizationId, instanceId, stepId);
    if (!stepInstance || stepInstance.status === 'completed' || stepInstance.status === 'skipped' || stepInstance.status === 'cancelled') {
      throw new StepInstanceNotFoundError(stepId);
    }
    return stepInstance;
  }

  return {
    async dispatch(command: ExecutionCommand): Promise<ExecutionHandoff> {
      const { organizationId } = command;
      const instance = await requireInstance(organizationId, command.instanceId);
      const version = await requireVersion(organizationId, instance.versionId);

      switch (command.command) {
        case 'start': {
          let current = instance;
          if (current.status === 'pending') {
            current = transitionWorkflowInstance(current, 'running', now());
            await deps.instanceRepository.save(current);
            await recordHistory(organizationId, current.id, 'instance_started', `Workflow "${version.definitionId}" started`);
            deps.eventBus?.publish('workflow_instance.started', { instanceId: current.id, definitionId: current.definitionId });
          }
          if (command.variables) {
            current = { ...current, variables: { ...current.variables, ...command.variables }, updatedAt: now() };
            await deps.instanceRepository.save(current);
          }
          const { handoff } = await startStep(organizationId, current, version, command.stepId);
          return handoff;
        }

        case 'complete': {
          const stepInstance = await requireNonTerminalStepInstance(organizationId, instance.id, command.stepId);
          const step = requireStepDef(version, command.stepId);
          let completed = transitionStepInstance(stepInstance, 'completed', now());
          completed = { ...completed, output: command.variables ?? completed.output };
          await deps.stepInstanceRepository.save(completed);
          await recordHistory(organizationId, instance.id, 'step_completed', `Step "${step.name}" completed`, command.stepId, completed.id);
          await recordExecutionHistory(organizationId, completed);
          deps.eventBus?.publish('step.completed', { instanceId: instance.id, stepId: command.stepId, stepInstanceId: completed.id });

          await advanceAfterStep(organizationId, instance, version, completed, command.variables);

          return {
            instanceId: instance.id,
            stepInstanceId: completed.id,
            target: TARGET_BY_TYPE[completed.stepType],
            referenceId: completed.id,
            status: 'completed',
          };
        }

        case 'fail': {
          const stepInstance = await requireNonTerminalStepInstance(organizationId, instance.id, command.stepId);
          const step = requireStepDef(version, command.stepId);
          const errorMessage = String(command.variables?.errorMessage ?? `Step "${step.name}" failed`);
          let failed = transitionStepInstance(stepInstance, 'failed', now());
          failed = { ...failed, errorMessage };
          await deps.stepInstanceRepository.save(failed);
          await recordHistory(organizationId, instance.id, 'step_failed', `Step "${step.name}" failed: ${errorMessage}`, command.stepId, failed.id);
          await recordExecutionHistory(organizationId, failed);
          deps.eventBus?.publish('step.failed', { instanceId: instance.id, stepId: command.stepId, errorMessage });
          await syncExecution(organizationId, instance);

          // A step with retry attempts remaining doesn't cascade to instance
          // failure yet — it awaits an explicit `dispatch({command: 'retry'})`.
          // Retries already exhausted internally for handler-driven failures
          // before startStep's catch block ever calls onStepFailed, so this
          // check only matters for externally-reported ('fail' command) failures.
          if (!step.retryPolicy || !canRetry(step.retryPolicy, failed.attempt)) {
            await onStepFailed(organizationId, instance, version, failed);
          }

          return {
            instanceId: instance.id,
            stepInstanceId: failed.id,
            target: TARGET_BY_TYPE[failed.stepType],
            referenceId: failed.id,
            status: 'failed',
          };
        }

        case 'retry': {
          const all = await deps.stepInstanceRepository.findByInstanceId(organizationId, instance.id);
          const failedInstance = all.find((candidate) => candidate.stepId === command.stepId && candidate.status === 'failed' && !candidate.compensationOf);
          if (!failedInstance) throw new StepInstanceNotFoundError(command.stepId);
          const step = requireStepDef(version, command.stepId);
          if (!step.retryPolicy || !canRetry(step.retryPolicy, failedInstance.attempt)) {
            throw new Error(`Step "${command.stepId}" has no retry attempts remaining`);
          }
          let reactivated = transitionStepInstance(failedInstance, 'active', now());
          reactivated = { ...reactivated, attempt: failedInstance.attempt + 1, errorMessage: undefined, startedAt: now() };
          await deps.stepInstanceRepository.save(reactivated);
          await recordHistory(organizationId, instance.id, 'step_started', `Step "${step.name}" retried (attempt ${reactivated.attempt})`, command.stepId, reactivated.id);
          deps.eventBus?.publish('step.started', { instanceId: instance.id, stepId: command.stepId, stepType: step.type });
          await syncExecution(organizationId, instance);

          return {
            instanceId: instance.id,
            stepInstanceId: reactivated.id,
            target: TARGET_BY_TYPE[reactivated.stepType],
            referenceId: reactivated.id,
            status: 'running',
          };
        }

        case 'skip': {
          const step = requireStepDef(version, command.stepId);
          if (!step.optional) throw new Error(`Step "${command.stepId}" is not optional and cannot be skipped`);
          const existing = await findMainStepInstance(organizationId, instance.id, command.stepId);
          const timestamp = now();
          const base: StepInstance =
            existing ??
            ({
              id: generateId('step-instance'),
              organizationId,
              createdAt: timestamp,
              updatedAt: timestamp,
              instanceId: instance.id,
              stepId: command.stepId,
              stepType: step.type,
              status: 'pending',
              attempt: 1,
            } satisfies StepInstance);
          const skipped = transitionStepInstance(base, 'skipped', timestamp);
          await deps.stepInstanceRepository.save(skipped);
          await recordHistory(organizationId, instance.id, 'step_skipped', `Step "${step.name}" skipped`, command.stepId, skipped.id);
          await advanceAfterStep(organizationId, instance, version, skipped);

          return {
            instanceId: instance.id,
            stepInstanceId: skipped.id,
            target: TARGET_BY_TYPE[skipped.stepType],
            referenceId: skipped.id,
            status: 'completed',
          };
        }

        case 'cancel': {
          const stepInstance = await requireNonTerminalStepInstance(organizationId, instance.id, command.stepId);
          const cancelled = transitionStepInstance(stepInstance, 'cancelled', now());
          await deps.stepInstanceRepository.save(cancelled);
          await recordHistory(organizationId, instance.id, 'step_failed', `Step "${command.stepId}" cancelled`, command.stepId, cancelled.id);
          await syncExecution(organizationId, instance);

          return {
            instanceId: instance.id,
            stepInstanceId: cancelled.id,
            target: TARGET_BY_TYPE[cancelled.stepType],
            referenceId: cancelled.id,
            status: 'cancelled',
          };
        }

        default:
          throw new Error(`Unsupported execution command "${String(command.command)}"`);
      }
    },

    async advance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<string> {
      const instance = await requireInstance(organizationId, instanceId);
      const version = await requireVersion(organizationId, instance.versionId);
      const stepInstances = await deps.stepInstanceRepository.findByInstanceId(organizationId, instanceId);
      const waiting = stepInstances.find((candidate) => candidate.status === 'waiting' && candidate.resumeAt);
      if (!waiting) {
        throw new Error(`Workflow instance "${instanceId}" has no waiting step to advance`);
      }
      const timestamp = now();
      if (waiting.resumeAt! > timestamp) {
        throw new WaitNotElapsedError(waiting.id, waiting.resumeAt!);
      }

      const completed = transitionStepInstance(waiting, 'completed', timestamp);
      await deps.stepInstanceRepository.save(completed);
      const step = requireStepDef(version, waiting.stepId);
      await recordHistory(organizationId, instance.id, 'step_completed', `Step "${step.name}" resumed and completed`, waiting.stepId, completed.id);
      await recordExecutionHistory(organizationId, completed);
      deps.eventBus?.publish('step.completed', { instanceId: instance.id, stepId: waiting.stepId, stepInstanceId: completed.id });
      await advanceAfterStep(organizationId, instance, version, completed);

      return deriveExecutionId(instanceId);
    },

    async suspend(organizationId: OrganizationId, instanceId: WorkflowInstanceId, reason: string): Promise<void> {
      const instance = await requireInstance(organizationId, instanceId);
      const suspended = transitionWorkflowInstance(instance, 'suspended', now());
      await deps.instanceRepository.save(suspended);
      await recordHistory(organizationId, instanceId, 'instance_suspended', `Workflow suspended: ${reason}`);
      await syncExecution(organizationId, suspended);
      deps.eventBus?.publish('workflow_instance.suspended', { instanceId, reason });
    },

    async resume(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<void> {
      const instance = await requireInstance(organizationId, instanceId);
      const resumed = transitionWorkflowInstance(instance, 'running', now());
      await deps.instanceRepository.save(resumed);
      await recordHistory(organizationId, instanceId, 'instance_resumed', 'Workflow resumed');
      await syncExecution(organizationId, resumed);
      deps.eventBus?.publish('workflow_instance.resumed', { instanceId });
    },

    async cancel(organizationId: OrganizationId, instanceId: WorkflowInstanceId, reason: string): Promise<void> {
      const instance = await requireInstance(organizationId, instanceId);
      const cancelled = transitionWorkflowInstance(instance, 'cancelled', now());
      await deps.instanceRepository.save(cancelled);
      await recordHistory(organizationId, instanceId, 'instance_cancelled', `Workflow cancelled: ${reason}`);
      await syncExecution(organizationId, cancelled);
      deps.eventBus?.publish('workflow_instance.cancelled', { instanceId, reason });
    },
  };
}
