/**
 * @lateen-os/ai-runtime — AI Runtime
 *
 * Operating system for AI agents in Lateen OS. Manages the complete lifecycle
 * of AI agents — not an LLM wrapper or model integration.
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

export type {
  AgentRegistry,
  AgentRegistration,
  AgentDescriptor,
} from './registry/types.js';

export type {
  RuntimeSession,
  RuntimeState,
  RuntimeContext,
  RuntimeSessionId,
} from './runtime/types.js';

export type {
  Task,
  TaskQueue,
  TaskPriority,
  TaskStatus,
  TaskResult,
  TaskId,
} from './task/types.js';

export type {
  ExecutionPlan,
  ExecutionContext,
  ExecutionResult,
} from './execution/types.js';

export type {
  Conversation,
  ConversationMessage,
  ConversationThread,
} from './conversation/types.js';

export type {
  WorkingMemory,
  MemoryReference,
  ContextWindow,
} from './memory/types.js';

export type {
  AgentContext,
  BusinessContext,
  DecisionContextReference,
} from './context/types.js';

export type { Planner, Plan, PlanStep } from './planner/index.js';

export type { Scheduler, Schedule, Trigger } from './scheduler/index.js';

export type {
  Orchestrator,
  AgentCoordinator,
  MultiAgentWorkflow,
} from './orchestrator/index.js';

export type { AgentMessage, MessageType, Channel } from './communication/types.js';

export type { Tool, ToolCall, ToolResult, ToolDescriptor } from './tooling/types.js';

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

export type { RuntimeQueries } from './queries/runtime-queries.js';
