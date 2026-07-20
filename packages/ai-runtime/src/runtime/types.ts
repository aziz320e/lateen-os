/** @module runtime/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentContextId,
  OrganizationId,
  RuntimeAgentId,
  RuntimeSessionId,
  TaskId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { RuntimeSessionId };

export type RuntimeState =
  | 'initializing'
  | 'ready'
  | 'busy'
  | 'waiting'
  | 'paused'
  | 'shutting_down'
  | 'terminated';

export interface RuntimeContext {
  readonly sessionId: RuntimeSessionId;
  readonly agentContextId?: AgentContextId;
  readonly activeTaskId?: TaskId;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Active runtime session for an agent. */
export interface RuntimeSession extends TenantAuditableEntity<RuntimeSessionId> {
  readonly runtimeAgentId: RuntimeAgentId;
  readonly state: RuntimeState;
  readonly context: RuntimeContext;
  readonly startedAt: Timestamp;
  readonly endedAt?: Timestamp;
}

export type { OrganizationId };
