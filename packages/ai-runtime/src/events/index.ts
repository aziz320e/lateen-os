/** @module events */
export type { RuntimeAgentDomainEvent, RuntimeAgentEventName } from '../agent/events.js';
export type {
  AgentRegistryDomainEvent,
  AgentRegistryEventName,
} from '../registry/events.js';
export type { RuntimeSessionDomainEvent, RuntimeSessionEventName } from '../runtime/events.js';
export type { TaskDomainEvent, TaskEventName } from '../task/events.js';
export type {
  ExecutionPlanDomainEvent,
  ExecutionPlanEventName,
  ExecutionResultDomainEvent,
  ExecutionResultEventName,
} from '../execution/events.js';
export type { ConversationDomainEvent, ConversationEventName } from '../conversation/events.js';
export type { WorkingMemoryDomainEvent, WorkingMemoryEventName } from '../memory/events.js';
export type { AgentContextDomainEvent, AgentContextEventName } from '../context/events.js';
export type { PlanDomainEvent, PlanEventName } from '../planner/events.js';
export type { ScheduleDomainEvent, ScheduleEventName } from '../scheduler/events.js';
export type {
  OrchestrationDomainEvent,
  OrchestrationEventName,
} from '../orchestrator/events.js';
export type { AgentMessageDomainEvent, AgentMessageEventName } from '../communication/events.js';
export type { ToolDomainEvent, ToolEventName } from '../tooling/events.js';
export type {
  RuntimePermissionDomainEvent,
  RuntimePermissionEventName,
} from '../permissions/events.js';
export type { HealthDomainEvent, HealthEventName } from '../monitoring/events.js';
export type { TelemetryDomainEvent, TelemetryEventName } from '../telemetry/events.js';

/** Union of all AI Runtime domain events. */
export type AiRuntimeDomainEvent =
  | import('../agent/events.js').RuntimeAgentDomainEvent
  | import('../registry/events.js').AgentRegistryDomainEvent
  | import('../runtime/events.js').RuntimeSessionDomainEvent
  | import('../task/events.js').TaskDomainEvent
  | import('../execution/events.js').ExecutionPlanDomainEvent
  | import('../execution/events.js').ExecutionResultDomainEvent
  | import('../conversation/events.js').ConversationDomainEvent
  | import('../memory/events.js').WorkingMemoryDomainEvent
  | import('../context/events.js').AgentContextDomainEvent
  | import('../planner/events.js').PlanDomainEvent
  | import('../scheduler/events.js').ScheduleDomainEvent
  | import('../orchestrator/events.js').OrchestrationDomainEvent
  | import('../communication/events.js').AgentMessageDomainEvent
  | import('../tooling/events.js').ToolDomainEvent
  | import('../permissions/events.js').RuntimePermissionDomainEvent
  | import('../monitoring/events.js').HealthDomainEvent
  | import('../telemetry/events.js').TelemetryDomainEvent;
export * from './runtime-event-bus.js';
