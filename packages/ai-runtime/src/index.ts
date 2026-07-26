/**
 * @lateen-os/ai-runtime — AI Runtime
 *
 * Operating system for AI agents in Lateen OS. Manages the complete lifecycle
 * of AI agents. Real conversation runtime, task queue/executor, tool
 * execution framework, planner, working memory, scheduler, orchestrator,
 * agent registry, and query layer — see createAiRuntime-style factories
 * throughout this module. Conversation/planner consume
 * `@lateen-os/ai-provider-hub` for real inference; every other piece is
 * deterministic and fully usable without a live provider.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as agent from './agent/index.js';
export * as registry from './registry/index.js';
export * as runtime from './runtime/index.js';
export * as task from './task/index.js';
export * as execution from './execution/index.js';
export * as conversation from './conversation/index.js';
export * as memory from './memory/index.js';
export * as context from './context/index.js';
export * as planner from './planner/index.js';
export * as scheduler from './scheduler/index.js';
export * as orchestrator from './orchestrator/index.js';
export * as communication from './communication/index.js';
export * as tooling from './tooling/index.js';
export * as permissions from './permissions/index.js';
export * as monitoring from './monitoring/index.js';
export * as telemetry from './telemetry/index.js';
export * as events from './events/index.js';
export * as queries from './queries/index.js';
export * as prompts from './prompts/index.js';

export type {
  Agent,
  AgentProfile,
  AgentRole,
  AgentCapability,
  AgentStatus,
  AgentLifecycle,
  RuntimeAgentId,
  RuntimeWorkforceType,
} from './agent/types.js';
export type { AgentRepository } from './agent/repository.js';
export { createAgentRepository } from './agent/repository.impl.js';

export type {
  AgentRegistry,
  AgentRegistration,
  AgentDescriptor,
} from './registry/types.js';
export type { AgentRegistryRepository } from './registry/repository.js';
export { createAgentRegistryRepository } from './registry/repository.impl.js';
export {
  createAgentRegistryService,
  type AgentRegistryService,
} from './registry/agent-registry.impl.js';

export type {
  RuntimeSession,
  RuntimeState,
  RuntimeContext,
  RuntimeSessionId,
} from './runtime/types.js';
export type { RuntimeSessionRepository } from './runtime/repository.js';
export { createRuntimeSessionRepository } from './runtime/repository.impl.js';

export type {
  Task,
  TaskQueue,
  TaskPriority,
  TaskStatus,
  TaskResult,
  TaskId,
} from './task/types.js';
export type { TaskRepository } from './task/repository.js';
export { createTaskRepository } from './task/repository.impl.js';
export {
  createTaskQueueService,
  type TaskQueueService,
} from './task/task-queue.impl.js';
export {
  createTaskExecutor,
  type TaskExecutor,
  type TaskHandler,
  type TaskHandlerContext,
} from './task/task-executor.impl.js';

export type {
  ExecutionPlan,
  ExecutionContext,
  ExecutionResult,
} from './execution/types.js';
export type { ExecutionPlanRepository, ExecutionResultRepository } from './execution/repository.js';
export {
  createExecutionPlanRepository,
  createExecutionResultRepository,
} from './execution/repository.impl.js';

export type {
  Conversation,
  ConversationMessage,
  ConversationThread,
} from './conversation/types.js';
export type { ConversationRepository } from './conversation/repository.js';
export { createConversationRepository } from './conversation/repository.impl.js';
export {
  createConversationRuntimeService,
  type ConversationRuntimeService,
  type ConversationRuntimeDeps,
  type SendMessageInput,
} from './conversation/conversation.impl.js';

export type {
  WorkingMemory,
  MemoryReference,
  ContextWindow,
} from './memory/types.js';
export type { WorkingMemoryRepository } from './memory/repository.js';
export { createWorkingMemoryRepository } from './memory/repository.impl.js';
export {
  createWorkingMemoryService,
  trimToWindow,
  type WorkingMemoryService,
} from './memory/working-memory.impl.js';

export type {
  AgentContext,
  BusinessContext,
  DecisionContextReference,
} from './context/types.js';

export type { Planner, Plan, PlanStep } from './planner/index.js';
export type { PlanRepository } from './planner/repository.js';
export { createPlanRepository } from './planner/repository.impl.js';
export { createPlanner, type PlannerDeps } from './planner/planner.impl.js';

export type { Scheduler, Schedule, Trigger } from './scheduler/index.js';
export type { ScheduleRepository } from './scheduler/repository.js';
export { createScheduleRepository } from './scheduler/repository.impl.js';
export { createScheduler, type SchedulerDeps } from './scheduler/scheduler.impl.js';

export type {
  Orchestrator,
  AgentCoordinator,
  MultiAgentWorkflow,
} from './orchestrator/index.js';
export type { MultiAgentWorkflowRepository } from './orchestrator/repository.js';
export { createMultiAgentWorkflowRepository } from './orchestrator/repository.impl.js';
export { createOrchestrator, type OrchestratorDeps } from './orchestrator/orchestrator.impl.js';

export type { AgentMessage, MessageType, Channel } from './communication/types.js';

export type { Tool, ToolCall, ToolResult, ToolDescriptor } from './tooling/types.js';
export type { ToolRepository, ToolCallRepository } from './tooling/repository.js';
export { createToolRepository, createToolCallRepository } from './tooling/repository.impl.js';
export {
  createToolExecutionFramework,
  type ToolExecutionFramework,
  type ToolExecutionContext,
  type ToolHandler,
  type RegisteredTool,
  type ToolInvocation,
} from './tooling/tool-executor.impl.js';

export type {
  RuntimePermission,
  AgentPermission,
  CapabilityPermission,
} from './permissions/types.js';

export type {
  HealthStatus,
  RuntimeMetrics,
  ExecutionMetrics,
} from './monitoring/types.js';

export type { TelemetryEvent, Trace, Span } from './telemetry/types.js';

export type { AiRuntimeDomainEvent } from './events/index.js';
export {
  createRuntimeEventBus,
  type RuntimeEventBus,
  type RuntimeEventMap,
} from './events/runtime-event-bus.js';

export type { RuntimeQueries } from './queries/runtime-queries.js';
export {
  createRuntimeQueries,
  type RuntimeQueriesDeps,
} from './queries/runtime-queries.impl.js';

export {
  createPromptLoader,
  renderPrompt,
  type PromptLoader,
  type PromptTemplate,
  type RenderOptions,
} from './prompts/prompt-loader.js';

export {
  ProviderError,
  TaskExecutionError,
  ToolExecutionError,
  PlanningError,
} from './shared/errors.js';
