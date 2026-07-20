import { connect, type NatsConnection, StringCodec } from 'nats';
import type { DomainEvent } from '@lateen-os/business-dna';
import type { DomainEventPublisher } from '../domain/ports.js';
import { buildEventSubject, type NatsDomainEventPublisher } from './types.js';

const sc = StringCodec();

export class NatsEventPublisher implements NatsDomainEventPublisher {
  private connection: NatsConnection | null = null;

  constructor(
    private readonly servers: string,
    private readonly subjectPrefix: string,
  ) {}

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = await connect({ servers: this.servers });
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.publishBatch([event]);
  }

  async publishBatch(events: readonly DomainEvent[]): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }
    for (const event of events) {
      const subject = buildEventSubject(this.subjectPrefix, event.eventName);
      this.connection!.publish(subject, sc.encode(JSON.stringify(event)));
    }
    await this.connection!.flush();
  }
}

export function createEventPublisher(
  servers: string,
  subjectPrefix: string,
): DomainEventPublisher {
  return new NatsEventPublisher(servers, subjectPrefix);
}
