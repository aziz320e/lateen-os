/**
 * In-memory store for completed reasoning sessions, keyed by organization.
 * `ReasoningResult` has no `id` field (only `sessionId`), so it doesn't fit
 * shared-kernel's generic `InMemoryRepository` — this is the small,
 * purpose-built equivalent used by the composition root and query layer.
 *
 * @module reasoning/session-store
 */
import type { ReasoningResult } from './types.js';

export interface ReasoningSessionStore {
  save(result: ReasoningResult): void;
  list(organizationId: string): readonly ReasoningResult[];
}

/** Creates an in-memory {@link ReasoningSessionStore}. */
export function createReasoningSessionStore(): ReasoningSessionStore {
  const sessions: ReasoningResult[] = [];
  return {
    save(result) {
      sessions.push(result);
    },
    list(organizationId) {
      return sessions.filter((session) => session.organizationId === organizationId);
    },
  };
}
