/** @module branch/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';
import type { BranchStatus } from './types.js';

export type BranchEventName =
  | DomainEventName<'branch', 'created'>
  | DomainEventName<'branch', 'activated'>
  | DomainEventName<'branch', 'deactivated'>
  | DomainEventName<'branch', 'archived'>
  | DomainEventName<'branch', 'updated'>;

export interface BranchStatusChangedPayload {
  readonly previousStatus: BranchStatus;
  readonly newStatus: BranchStatus;
}

export type BranchDomainEvent =
  | DomainEvent<'branch.created', { readonly code: string }>
  | DomainEvent<'branch.activated', BranchStatusChangedPayload>
  | DomainEvent<'branch.deactivated', BranchStatusChangedPayload>
  | DomainEvent<'branch.archived', BranchStatusChangedPayload>
  | DomainEvent<'branch.updated', Record<string, unknown>>;
