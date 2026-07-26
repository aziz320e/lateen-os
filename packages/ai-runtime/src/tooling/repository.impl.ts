/** Real in-memory {@link ToolRepository} and {@link ToolCallRepository} implementations. @module tooling/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ToolCallId, ToolId } from '../shared/identifiers.js';
import type { Tool, ToolCall } from './types.js';
import type { ToolCallRepository, ToolRepository } from './repository.js';

export function createToolRepository(seed?: readonly Tool[]): ToolRepository {
  return createInMemoryRepository<Tool, ToolId>({ seed });
}

export function createToolCallRepository(seed?: readonly ToolCall[]): ToolCallRepository {
  const repo = createInMemoryRepository<ToolCall, ToolCallId>({ seed });
  return {
    ...repo,
    async findByTool(organizationId, toolId) {
      return repo.list(organizationId).filter((call) => call.toolId === toolId);
    },
  };
}
