/** @module tooling/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  RuntimeAgentId,
  ToolCallId,
  ToolId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ToolId, ToolCallId };

/** Descriptor for a tool available to agents. */
export interface ToolDescriptor {
  readonly toolId: ToolId;
  readonly name: string;
  readonly description?: string;
  readonly inputSchema?: Readonly<Record<string, unknown>>;
}

/** Registered tool in the runtime. */
export interface Tool extends TenantAuditableEntity<ToolId> {
  readonly descriptor: ToolDescriptor;
  readonly enabled: boolean;
}

/** Invocation of a tool by an agent. */
export interface ToolCall extends TenantAuditableEntity<ToolCallId> {
  readonly toolId: ToolId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly input: Readonly<Record<string, unknown>>;
  readonly requestedAt: Timestamp;
}

/** Outcome of a tool invocation. */
export interface ToolResult {
  readonly toolCallId: ToolCallId;
  readonly success: boolean;
  readonly output?: Readonly<Record<string, unknown>>;
  readonly errorCode?: string;
  readonly completedAt: Timestamp;
}

export type { OrganizationId };
