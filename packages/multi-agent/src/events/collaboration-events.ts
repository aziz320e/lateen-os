/** @module events/collaboration-events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { WorkerId } from '../shared/identifiers.js';

export type MissionEventName =
  | DomainEventName<'mission', 'started'>
  | DomainEventName<'mission', 'completed'>
  | DomainEventName<'mission', 'escalated'>;

export type MissionDomainEvent =
  | DomainEvent<'mission.started', { readonly code: string; readonly title: string }>
  | DomainEvent<'mission.completed', { readonly outcomeScore?: string }>
  | DomainEvent<'mission.escalated', { readonly reason: string; readonly level: string }>;

export type WorkerAssignmentEventName = DomainEventName<'worker', 'assigned'>;

export type WorkerAssignmentDomainEvent = DomainEvent<
  'worker.assigned',
  { readonly workerId: WorkerId; readonly missionId: string; readonly role: string }
>;

export type DelegationEventName = DomainEventName<'delegation', 'created'>;

export type DelegationDomainEvent = DomainEvent<
  'delegation.created',
  { readonly sourceWorkerId: WorkerId; readonly targetWorkerId: WorkerId; readonly objective: string }
>;

export type ConsensusEventName = DomainEventName<'consensus', 'reached'>;

export type ConsensusDomainEvent = DomainEvent<
  'consensus.reached',
  { readonly strategy: string; readonly agreementScore: string; readonly reached: boolean }
>;

/** Canonical event names for external subscribers. */
export const COLLABORATION_EVENT_NAMES = {
  MissionStarted: 'mission.started',
  MissionCompleted: 'mission.completed',
  WorkerAssigned: 'worker.assigned',
  DelegationCreated: 'delegation.created',
  ConsensusReached: 'consensus.reached',
  MissionEscalated: 'mission.escalated',
} as const;

/** Union of all Multi-Agent Collaboration domain events. */
export type CollaborationDomainEvent =
  | MissionDomainEvent
  | WorkerAssignmentDomainEvent
  | DelegationDomainEvent
  | ConsensusDomainEvent;
