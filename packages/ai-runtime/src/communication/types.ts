/** @module communication/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentMessageId,
  OrganizationId,
  RuntimeAgentId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { AgentMessageId };

export type MessageType =
  | 'command'
  | 'query'
  | 'response'
  | 'notification'
  | 'handoff'
  | 'heartbeat';

export type ChannelType = 'direct' | 'broadcast' | 'workflow' | 'system';

/** Communication channel between agents or runtime components. */
export interface Channel {
  readonly type: ChannelType;
  readonly name: string;
  readonly participantAgentIds: readonly RuntimeAgentId[];
}

/** Inter-agent or runtime message. */
export interface AgentMessage extends TenantAuditableEntity<AgentMessageId> {
  readonly fromAgentId: RuntimeAgentId;
  readonly toAgentId?: RuntimeAgentId;
  readonly channel: Channel;
  readonly messageType: MessageType;
  readonly payload: string;
  readonly sentAt: Timestamp;
}

export type { OrganizationId };
