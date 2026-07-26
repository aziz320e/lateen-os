/**
 * Workflow Runtime — the package's composition root. Wires every real
 * in-memory repository, the condition evaluator, the orchestrator, and the
 * query layer together, and adds the two operations the orchestrator
 * itself deliberately doesn't own: defining a workflow (persisting its
 * graph) and starting an instance (creating it and kicking off the first
 * step through the orchestrator).
 *
 * @module runtime
 */
import { createConditionEvaluator } from './condition/evaluator.impl.js';
import type { ConditionEvaluator } from './condition/evaluator.js';
import {
  createExpressionRepository,
  createPolicyConditionRepository,
} from './condition/repository.impl.js';
import type { ExpressionRepository, PolicyConditionRepository } from './condition/repository.js';
import { createWorkflowOrchestrator } from './execution/orchestrator.impl.js';
import type { StepHandler } from './execution/step-handler.js';
import type { WorkflowOrchestrator } from './execution/types.js';
import { createWorkflowEventBus } from './events/workflow-event-bus.js';
import type { WorkflowEventBus } from './events/workflow-event-bus.js';
import {
  createAuditTrailRepository,
  createExecutionHistoryRepository,
  createWorkflowHistoryRepository,
} from './history/repository.impl.js';
import type { AuditTrailRepository, ExecutionHistoryRepository, WorkflowHistoryRepository } from './history/repository.js';
import {
  createWorkflowExecutionRepository,
  createWorkflowInstanceRepository,
} from './instance/repository.impl.js';
import type { WorkflowExecutionRepository, WorkflowInstanceRepository } from './instance/repository.js';
import type { WorkflowInstance } from './instance/types.js';
import { createWorkflowQueries } from './queries/workflow-queries.impl.js';
import type { WorkflowQueries } from './queries/workflow-queries.js';
import { generateId, nowIso } from './shared/id.js';
import { WorkflowDefinitionNotFoundError, WorkflowVersionNotFoundError } from './shared/errors.js';
import type { OrganizationId, WorkflowDefinitionId } from './shared/identifiers.js';
import { createStepInstanceRepository } from './step/repository.impl.js';
import type { StepInstanceRepository } from './step/repository.js';
import type { StepType } from './step/types.js';
import type { Transition } from './transition/types.js';
import { createWorkflowDefinitionRepository, createWorkflowVersionRepository } from './workflow/repository.impl.js';
import type { WorkflowDefinitionRepository, WorkflowVersionRepository } from './workflow/repository.js';
import type { SemanticVersion } from './shared/primitives.js';
import type { WorkflowDefinition, WorkflowMetadata, WorkflowVersion } from './workflow/types.js';
import type { WorkflowStep } from './step/types.js';

export interface WorkflowRuntimeDeps {
  readonly definitionRepository?: WorkflowDefinitionRepository;
  readonly versionRepository?: WorkflowVersionRepository;
  readonly instanceRepository?: WorkflowInstanceRepository;
  readonly executionRepository?: WorkflowExecutionRepository;
  readonly stepInstanceRepository?: StepInstanceRepository;
  readonly workflowHistoryRepository?: WorkflowHistoryRepository;
  readonly executionHistoryRepository?: ExecutionHistoryRepository;
  readonly auditTrailRepository?: AuditTrailRepository;
  readonly policyConditionRepository?: PolicyConditionRepository;
  readonly expressionRepository?: ExpressionRepository;
  readonly conditionEvaluator?: ConditionEvaluator;
  /** Registered per step type; a type with no handler waits for an external `dispatch('complete'|'fail')`. */
  readonly stepHandlers?: Partial<Record<StepType, StepHandler>>;
  readonly eventBus?: WorkflowEventBus;
  /** Injectable clock for deterministic tests. Defaults to real time. */
  readonly now?: () => string;
}

export interface DefineWorkflowInput {
  readonly organizationId: OrganizationId;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly metadata: WorkflowMetadata;
  readonly version: SemanticVersion;
  readonly steps: readonly WorkflowStep[];
  readonly transitions: readonly Transition[];
}

export interface DefinedWorkflow {
  readonly definition: WorkflowDefinition;
  readonly version: WorkflowVersion;
}

export interface StartWorkflowInput {
  readonly organizationId: OrganizationId;
  readonly definitionId: WorkflowDefinitionId;
  readonly startedBy?: string;
  readonly correlationId?: string;
  readonly variables?: Readonly<Record<string, unknown>>;
}

/** Central workflow coordination facade. */
export interface WorkflowRuntime {
  /** Persists a workflow's executable graph as a new published definition + version. */
  defineWorkflow(input: DefineWorkflowInput): Promise<DefinedWorkflow>;
  /** Creates an instance and starts its first step through the orchestrator. */
  startWorkflow(input: StartWorkflowInput): Promise<WorkflowInstance>;
  readonly orchestrator: WorkflowOrchestrator;
  readonly queries: WorkflowQueries;
}

/** Creates a real, in-memory {@link WorkflowRuntime}. */
export function createWorkflowRuntime(deps: WorkflowRuntimeDeps = {}): WorkflowRuntime {
  const now = deps.now ?? nowIso;

  const definitionRepository = deps.definitionRepository ?? createWorkflowDefinitionRepository();
  const versionRepository = deps.versionRepository ?? createWorkflowVersionRepository();
  const instanceRepository = deps.instanceRepository ?? createWorkflowInstanceRepository();
  const executionRepository = deps.executionRepository ?? createWorkflowExecutionRepository();
  const stepInstanceRepository = deps.stepInstanceRepository ?? createStepInstanceRepository();
  const workflowHistoryRepository = deps.workflowHistoryRepository ?? createWorkflowHistoryRepository();
  const executionHistoryRepository = deps.executionHistoryRepository ?? createExecutionHistoryRepository();
  const auditTrailRepository = deps.auditTrailRepository ?? createAuditTrailRepository();
  const policyConditionRepository = deps.policyConditionRepository ?? createPolicyConditionRepository();
  const expressionRepository = deps.expressionRepository ?? createExpressionRepository();
  const conditionEvaluator = deps.conditionEvaluator ?? createConditionEvaluator();
  const eventBus = deps.eventBus ?? createWorkflowEventBus();

  const orchestrator = createWorkflowOrchestrator({
    versionRepository,
    instanceRepository,
    executionRepository,
    stepInstanceRepository,
    workflowHistoryRepository,
    executionHistoryRepository,
    policyConditionRepository,
    expressionRepository,
    conditionEvaluator,
    stepHandlers: deps.stepHandlers,
    eventBus,
    now,
  });

  const queries = createWorkflowQueries({
    definitionRepository,
    versionRepository,
    instanceRepository,
    stepInstanceRepository,
    workflowHistoryRepository,
    executionHistoryRepository,
    auditTrailRepository,
  });

  return {
    async defineWorkflow(input: DefineWorkflowInput): Promise<DefinedWorkflow> {
      const timestamp = now();
      const definitionId = generateId('workflow-definition');
      const versionId = generateId('workflow-version');

      const version: WorkflowVersion = {
        id: versionId,
        organizationId: input.organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        definitionId,
        version: input.version,
        status: 'published',
        stepIds: input.steps.map((step) => step.stepId),
        steps: input.steps,
        transitions: input.transitions,
        publishedAt: timestamp,
      };
      await versionRepository.save(version);

      const definition: WorkflowDefinition = {
        id: definitionId,
        organizationId: input.organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        description: input.description,
        metadata: input.metadata,
        currentVersionId: versionId,
        status: 'published',
      };
      await definitionRepository.save(definition);

      eventBus.publish('workflow.defined', { definitionId, code: input.code, name: input.name });
      eventBus.publish('workflow.published', { definitionId, versionId, version: input.version });

      return { definition, version };
    },

    async startWorkflow(input: StartWorkflowInput): Promise<WorkflowInstance> {
      const definition = await definitionRepository.findById(input.organizationId, input.definitionId);
      if (!definition) throw new WorkflowDefinitionNotFoundError(input.definitionId);

      const version = await versionRepository.findById(input.organizationId, definition.currentVersionId);
      if (!version) throw new WorkflowVersionNotFoundError(definition.currentVersionId);
      if (version.stepIds.length === 0) {
        throw new Error(`Workflow version "${version.id}" has no steps to start`);
      }

      const timestamp = now();
      const instance: WorkflowInstance = {
        id: generateId('workflow-instance'),
        organizationId: input.organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        definitionId: definition.id,
        versionId: version.id,
        status: 'pending',
        startedAt: timestamp,
        startedBy: input.startedBy,
        correlationId: input.correlationId,
        variables: input.variables ?? {},
      };
      await instanceRepository.save(instance);

      await orchestrator.dispatch({
        organizationId: input.organizationId,
        instanceId: instance.id,
        stepId: version.stepIds[0]!,
        command: 'start',
        issuedAt: timestamp,
        issuedBy: input.startedBy,
      });

      const finalInstance = await instanceRepository.findById(input.organizationId, instance.id);
      return finalInstance ?? instance;
    },

    orchestrator,
    queries,
  };
}
