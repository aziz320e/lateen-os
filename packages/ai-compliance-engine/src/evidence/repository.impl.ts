/** Real, in-memory {@link EvidenceRepository} implementation. @module evidence/repository.impl */
import type { EvidenceRepository } from './repository.js';
import type { EvidenceRecord } from './types.js';

/** Creates a real, in-memory, append-only {@link EvidenceRepository}. */
export function createEvidenceRepository(seed?: readonly EvidenceRecord[]): EvidenceRepository {
  const store = new Map<string, EvidenceRecord>();
  for (const record of seed ?? []) store.set(record.id, record);

  function list(organizationId: string): EvidenceRecord[] {
    return [...store.values()].filter((record) => record.organizationId === organizationId);
  }

  return {
    async save(record) {
      store.set(record.id, record);
    },
    async findById(organizationId, id) {
      const record = store.get(id);
      if (!record || record.organizationId !== organizationId) return null;
      return record;
    },
    async findAll(organizationId) {
      return list(organizationId);
    },
    async findByControlId(organizationId, controlId) {
      return list(organizationId).filter((record) => record.controlId === controlId);
    },
    async findByFrameworkId(organizationId, frameworkId) {
      return list(organizationId).filter((record) => record.frameworkId === frameworkId);
    },
  };
}
