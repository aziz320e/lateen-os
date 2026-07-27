/** Real, in-memory {@link ThreatRepository} implementation. @module threat-detection/repository.impl */
import type { ThreatRepository } from './repository.js';
import type { Threat } from './types.js';

/** Creates a real, in-memory {@link ThreatRepository}. */
export function createThreatRepository(seed?: readonly Threat[]): ThreatRepository {
  const store = new Map<string, Threat>();
  for (const threat of seed ?? []) store.set(threat.id, threat);

  function list(organizationId: string): Threat[] {
    return [...store.values()].filter((threat) => threat.organizationId === organizationId);
  }

  return {
    async save(threat) {
      store.set(threat.id, threat);
    },
    async findById(organizationId, threatId) {
      const threat = store.get(threatId);
      if (!threat || threat.organizationId !== organizationId) return null;
      return threat;
    },
    async findAll(organizationId) {
      return list(organizationId);
    },
    async findByType(organizationId, threatType) {
      return list(organizationId).filter((threat) => threat.threatType === threatType);
    },
  };
}
