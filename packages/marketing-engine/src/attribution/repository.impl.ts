/** Real, in-memory {@link TouchpointRepository} implementation. @module attribution/repository.impl */
import type { TouchpointRepository } from './repository.js';
import type { Touchpoint } from './types.js';

/** Creates a real, in-memory {@link TouchpointRepository}. */
export function createTouchpointRepository(seed?: readonly Touchpoint[]): TouchpointRepository {
  const store = new Map<string, Touchpoint>();
  for (const touchpoint of seed ?? []) store.set(touchpoint.id, touchpoint);

  return {
    async save(touchpoint) {
      store.set(touchpoint.id, touchpoint);
    },
    async findById(organizationId, touchpointId) {
      const touchpoint = store.get(touchpointId);
      if (!touchpoint || touchpoint.organizationId !== organizationId) return null;
      return touchpoint;
    },
    async findByLead(organizationId, leadId) {
      return [...store.values()]
        .filter((touchpoint) => touchpoint.organizationId === organizationId && touchpoint.leadId === leadId)
        .sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0));
    },
  };
}
