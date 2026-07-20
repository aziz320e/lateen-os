import type { InstitutionalMemoryPort } from '../../ports/outbound/institutional-memory-port.js';

export class NoOpInstitutionalMemoryClient implements InstitutionalMemoryPort {
  async findKnowledgeByTopic() {
    return [];
  }

  async getKnowledgeEntry() {
    return null;
  }
}
