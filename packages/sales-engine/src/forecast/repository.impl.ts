/** Real, in-memory {@link ForecastSnapshotRepository} implementation. @module forecast/repository.impl */
import type { ForecastSnapshotRepository } from './repository.js';
import type { ForecastSnapshot } from './types.js';

/** Creates a real, in-memory {@link ForecastSnapshotRepository}. */
export function createForecastSnapshotRepository(seed?: readonly ForecastSnapshot[]): ForecastSnapshotRepository {
  const store = new Map<string, ForecastSnapshot>();
  for (const snapshot of seed ?? []) store.set(snapshot.id, snapshot);

  function sorted(organizationId: string): ForecastSnapshot[] {
    // Reverse insertion order first, then a stable sort by generatedAt descending — this
    // way, snapshots generated within the same millisecond still resolve most-recent-first.
    return [...store.values()]
      .filter((snapshot) => snapshot.organizationId === organizationId)
      .reverse()
      .sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : a.generatedAt > b.generatedAt ? -1 : 0));
  }

  return {
    async save(snapshot) {
      store.set(snapshot.id, snapshot);
    },
    async findAll(organizationId) {
      return sorted(organizationId);
    },
    async findLatest(organizationId) {
      return sorted(organizationId)[0] ?? null;
    },
  };
}
