/**
 * Runtime facade — composes the `@lateen-os/ai-runtime` services relevant
 * to a Lateen client: agent registry, task queue, conversation runtime,
 * multi-agent orchestrator, and the read-only query layer. Repositories
 * are constructed and wired here only; they are never exposed on the
 * returned facade. Scoped deliberately (not an exhaustive re-export of
 * every ai-runtime capability — scheduler, tool execution, and planning
 * remain available via `@lateen-os/ai-runtime` directly for advanced use).
 *
 * @module system/runtime
 */
import {
  createAgentRegistryRepository,
  createAgentRegistryService,
  createAgentRepository,
  createConversationRepository,
  createConversationRuntimeService,
  createExecutionPlanRepository,
  createExecutionResultRepository,
  createMultiAgentWorkflowRepository,
  createOrchestrator,
  createRuntimeQueries,
  createRuntimeSessionRepository,
  createTaskQueueService,
  createTaskRepository,
} from '@lateen-os/ai-runtime';
import type {
  AgentRegistryService,
  ConversationRuntimeService,
  Orchestrator,
  RuntimeEventBus,
  RuntimeQueries,
  TaskQueueService,
} from '@lateen-os/ai-runtime';
import type { StreamingChatProvider } from '@lateen-os/ai-provider-hub';

export interface RuntimeConfig {
  /** Powers the conversation runtime — typically `providerHub.capabilities.chat`. */
  readonly chatProvider: StreamingChatProvider;
  readonly eventBus?: RuntimeEventBus;
}

/** Public runtime facade — real agent registry, task queue, conversations, orchestrator, and a read-only query layer. No repositories exposed. */
export interface Runtime {
  readonly agentRegistry: AgentRegistryService;
  readonly taskQueue: TaskQueueService;
  readonly conversations: ConversationRuntimeService;
  readonly orchestrator: Orchestrator;
  readonly queries: RuntimeQueries;
}

/** Creates a {@link Runtime} over fresh in-memory repositories. */
export function createRuntimeFacade(config: RuntimeConfig): Runtime {
  const agentRepository = createAgentRepository();
  const agentRegistryRepository = createAgentRegistryRepository();
  const taskRepository = createTaskRepository();
  const runtimeSessionRepository = createRuntimeSessionRepository();
  const conversationRepository = createConversationRepository();
  const executionPlanRepository = createExecutionPlanRepository();
  const executionResultRepository = createExecutionResultRepository();
  const workflowRepository = createMultiAgentWorkflowRepository();

  return {
    agentRegistry: createAgentRegistryService(agentRegistryRepository),
    taskQueue: createTaskQueueService(taskRepository),
    conversations: createConversationRuntimeService({
      conversationRepository,
      chatProvider: config.chatProvider,
      eventBus: config.eventBus,
    }),
    orchestrator: createOrchestrator({ workflowRepository, eventBus: config.eventBus }),
    queries: createRuntimeQueries({
      agentRepository,
      taskRepository,
      runtimeSessionRepository,
      conversationRepository,
      executionPlanRepository,
      executionResultRepository,
    }),
  };
}
