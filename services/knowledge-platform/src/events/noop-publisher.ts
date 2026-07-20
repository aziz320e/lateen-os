import type { KnowledgeEvent, KnowledgeEventPublisher } from './knowledge-events.js';

export class NoopKnowledgeEventPublisher implements KnowledgeEventPublisher {
  async publish(_event: KnowledgeEvent): Promise<void> {
    // best-effort stub
  }
}
