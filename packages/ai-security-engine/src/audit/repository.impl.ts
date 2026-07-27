/** Real, in-memory {@link AuditEventRepository} implementation. @module audit/repository.impl */
import type { AuditEventRepository } from './repository.js';
import type { AuditEvent } from './types.js';

/** Creates a real, in-memory {@link AuditEventRepository}. */
export function createAuditEventRepository(seed?: readonly AuditEvent[]): AuditEventRepository {
  const store = new Map<string, AuditEvent>();
  for (const event of seed ?? []) store.set(event.id, event);

  function list(organizationId: string): AuditEvent[] {
    return [...store.values()].filter((event) => event.organizationId === organizationId);
  }

  return {
    async save(event) {
      store.set(event.id, event);
    },
    async findById(organizationId, eventId) {
      const event = store.get(eventId);
      if (!event || event.organizationId !== organizationId) return null;
      return event;
    },
    async findAll(organizationId) {
      return list(organizationId);
    },
    async findByCategory(organizationId, category) {
      return list(organizationId).filter((event) => event.category === category);
    },
    async findByActor(organizationId, actorId) {
      return list(organizationId).filter((event) => event.actorId === actorId);
    },
    async findByOutcome(organizationId, outcome) {
      return list(organizationId).filter((event) => event.outcome === outcome);
    },
  };
}
