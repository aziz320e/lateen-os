import type { DomainEvent } from '@lateen-os/business-dna';
import type { DomainEventPublisher } from '../domain/ports.js';

export class NoOpEventPublisher implements DomainEventPublisher {
  async publish(_event: DomainEvent): Promise<void> {}
  async publishBatch(_events: readonly DomainEvent[]): Promise<void> {}
}
