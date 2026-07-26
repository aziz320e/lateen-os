import { describe, expect, it } from 'vitest';
import { createWorkingMemoryService, trimToWindow } from '../src/memory/working-memory.impl.js';
import type { MemoryReference } from '../src/memory/types.js';

function ref(label: string): MemoryReference {
  return { type: 'runtime', label };
}

describe('trimToWindow', () => {
  it('keeps all entries when under budget', () => {
    const entries = [ref('a'), ref('b')];
    expect(trimToWindow(entries, { references: [], maxItems: 5 })).toHaveLength(2);
  });

  it('trims to maxItems, keeping the most recent', () => {
    const entries = [ref('a'), ref('b'), ref('c')];
    const trimmed = trimToWindow(entries, { references: [], maxItems: 2 });
    expect(trimmed.map((e) => e.label)).toEqual(['b', 'c']);
  });

  it('trims oldest entries until under the token budget', () => {
    // Each label is 20 chars -> ~5 tokens each.
    const entries = [ref('a'.repeat(20)), ref('b'.repeat(20)), ref('c'.repeat(20))];
    const trimmed = trimToWindow(entries, { references: [], maxTokens: 6 });
    expect(trimmed).toHaveLength(1);
    expect(trimmed[0]!.label).toBe('c'.repeat(20));
  });
});

describe('createWorkingMemoryService', () => {
  it('create builds a valid empty WorkingMemory', () => {
    const service = createWorkingMemoryService();
    const memory = service.create('org-1', 'session-1');
    expect(memory.organizationId).toBe('org-1');
    expect(memory.sessionId).toBe('session-1');
    expect(memory.entries).toEqual([]);
  });

  it('addReference appends and applies trimming from the context window', () => {
    const service = createWorkingMemoryService();
    let memory = service.create('org-1', 'session-1', { references: [], maxItems: 1 });
    memory = service.addReference(memory, ref('first'));
    memory = service.addReference(memory, ref('second'));
    expect(memory.entries).toHaveLength(1);
    expect(memory.entries[0]!.label).toBe('second');
  });
});
