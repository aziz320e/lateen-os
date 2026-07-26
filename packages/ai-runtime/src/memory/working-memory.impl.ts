/**
 * Real working-memory management — trims the oldest entries once the
 * context window's token or item budget is exceeded. Token counts are an
 * approximate heuristic (no tokenizer dependency): ~4 characters per token
 * over each entry's label, which is the only text a {@link MemoryReference}
 * carries.
 *
 * @module memory/working-memory.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId, RuntimeSessionId } from '../shared/identifiers.js';
import type { ContextWindow, MemoryReference, WorkingMemory } from './types.js';

const CHARS_PER_TOKEN = 4;
const DEFAULT_REFERENCE_TOKENS = 20;

function estimateTokens(reference: MemoryReference): number {
  return reference.label ? Math.ceil(reference.label.length / CHARS_PER_TOKEN) : DEFAULT_REFERENCE_TOKENS;
}

function totalTokens(entries: readonly MemoryReference[]): number {
  return entries.reduce((sum, entry) => sum + estimateTokens(entry), 0);
}

/** Trims the oldest entries (front of the array) until the window's token/item budgets are satisfied. */
export function trimToWindow(entries: readonly MemoryReference[], window: ContextWindow): readonly MemoryReference[] {
  let trimmed = entries;
  if (window.maxItems !== undefined && trimmed.length > window.maxItems) {
    trimmed = trimmed.slice(trimmed.length - window.maxItems);
  }
  if (window.maxTokens !== undefined) {
    while (trimmed.length > 0 && totalTokens(trimmed) > window.maxTokens) {
      trimmed = trimmed.slice(1);
    }
  }
  return trimmed;
}

export interface WorkingMemoryService {
  create(organizationId: OrganizationId, sessionId: RuntimeSessionId, window?: ContextWindow): WorkingMemory;
  addReference(memory: WorkingMemory, reference: MemoryReference): WorkingMemory;
}

/** Creates a {@link WorkingMemoryService} that manages real, budget-trimmed context windows. */
export function createWorkingMemoryService(): WorkingMemoryService {
  return {
    create(organizationId, sessionId, window = { references: [] }) {
      const now = new Date().toISOString();
      return {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        sessionId,
        contextWindow: window,
        entries: [],
      };
    },
    addReference(memory, reference) {
      const entries = trimToWindow([...memory.entries, reference], memory.contextWindow);
      return {
        ...memory,
        updatedAt: new Date().toISOString(),
        entries,
        contextWindow: { ...memory.contextWindow, references: entries },
      };
    },
  };
}
