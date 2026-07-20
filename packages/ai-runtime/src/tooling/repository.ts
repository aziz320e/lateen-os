/** @module tooling/repository */
import type { OrganizationId, ToolCallId, ToolId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Tool, ToolCall } from './types.js';

export interface ToolRepository extends Repository<Tool, ToolId> {}

export interface ToolCallRepository extends Repository<ToolCall, ToolCallId> {
  findByTool(organizationId: OrganizationId, toolId: ToolId): Promise<readonly ToolCall[]>;
}
