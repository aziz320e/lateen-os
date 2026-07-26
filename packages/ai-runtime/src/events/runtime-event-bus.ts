/**
 * Real, typed event bus for AI Runtime, built on shared-kernel's generic
 * {@link createEventBus}. Covers the event names actually published by
 * this package's real implementations (conversation, task, orchestrator);
 * not an exhaustive map of every domain in `events/index.ts`'s
 * {@link AiRuntimeDomainEvent} union, most of which have no publisher yet.
 *
 * @module events/runtime-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required here: interfaces are "open"
// (declaration merging could add incompatible members later), so TypeScript
// won't accept one to satisfy createEventBus's `Record<string, unknown>`
// constraint even though it's structurally compatible.
export type RuntimeEventMap = {
  'conversation.started': { readonly conversationId: string; readonly runtimeAgentId: string };
  'conversation.message_added': { readonly conversationId: string; readonly threadId: string; readonly role: string };
  'task.queued': { readonly taskId: string; readonly title: string };
  'task.assigned': { readonly taskId: string };
  'task.started': { readonly taskId: string };
  'task.completed': { readonly taskId: string };
  'task.failed': { readonly taskId: string; readonly errorCode?: string };
  'orchestration.started': { readonly orchestrationId: string; readonly workflowId: string };
  'orchestration.paused': { readonly orchestrationId: string };
  'orchestration.resumed': { readonly orchestrationId: string };
  'orchestration.cancelled': { readonly orchestrationId: string };
};

export type RuntimeEventBus = EventBus<RuntimeEventMap>;

/** Creates an in-memory {@link RuntimeEventBus}. */
export function createRuntimeEventBus(): RuntimeEventBus {
  return createEventBus<RuntimeEventMap>();
}
