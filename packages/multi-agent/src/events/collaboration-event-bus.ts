/**
 * Real, typed event bus for the Multi-Agent Collaboration Engine, built on
 * shared-kernel's generic {@link createEventBus}. Covers the events the
 * real services in this package actually publish; not an exhaustive map
 * of every domain in `collaboration-events.ts`'s
 * {@link CollaborationDomainEvent} union.
 *
 * @module events/collaboration-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint — see ai-runtime's runtime-event-bus.ts.
export type CollaborationEventMap = {
  'mission.started': { readonly missionId: string; readonly code: string };
  'mission.completed': { readonly missionId: string; readonly success: boolean };
  'mission.escalated': { readonly missionId: string; readonly reason: string };
  'agent.registered': { readonly workerId: string; readonly role: string };
  'agent.availability_changed': { readonly workerId: string; readonly availability: string };
  'session.started': { readonly sessionId: string; readonly missionId: string; readonly workerId: string };
  'session.ended': { readonly sessionId: string };
  'message.routed': { readonly messageId: string; readonly conversationId: string; readonly recipientCount: number };
  'delegation.requested': { readonly delegationId: string; readonly sourceWorkerId: string; readonly targetWorkerId: string };
  'delegation.responded': { readonly delegationId: string; readonly accepted: boolean };
  'coordination_step.advanced': { readonly stepId: string; readonly status: string };
  'conflict.detected': { readonly conflictId: string; readonly missionId: string; readonly competingProposalCount: number };
  'conflict.resolved': { readonly conflictId: string; readonly strategy: string };
  'consensus.reached': { readonly missionId: string; readonly strategy: string; readonly reached: boolean };
};

export type CollaborationEventBus = EventBus<CollaborationEventMap>;

/** Creates an in-memory {@link CollaborationEventBus}. */
export function createCollaborationEventBus(): CollaborationEventBus {
  return createEventBus<CollaborationEventMap>();
}
