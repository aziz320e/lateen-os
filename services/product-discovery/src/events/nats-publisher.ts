import { connect, type NatsConnection, StringCodec } from 'nats';
import type { DomainEvent } from '@lateen-os/shared-kernel/core';
import type { DiscoveryEventPublisher } from '../domain/ports.js';

const sc = StringCodec();

export class NatsDiscoveryEventPublisher implements DiscoveryEventPublisher {
  private connection: NatsConnection | undefined;

  constructor(
    private readonly natsUrl: string,
    private readonly subjectPrefix: string,
  ) {}

  private async getConnection(): Promise<NatsConnection> {
    if (!this.connection) {
      this.connection = await connect({ servers: this.natsUrl });
    }
    return this.connection;
  }

  async publish(event: DomainEvent<string, Record<string, unknown>>): Promise<void> {
    const nc = await this.getConnection();
    const subject = `${this.subjectPrefix}.${event.eventName}`;
    nc.publish(subject, sc.encode(JSON.stringify(event)));
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = undefined;
    }
  }
}

export class NoOpDiscoveryEventPublisher implements DiscoveryEventPublisher {
  async publish(): Promise<void> {}
}

export async function createEventPublisher(
  natsUrl: string,
  subjectPrefix: string,
): Promise<NatsDiscoveryEventPublisher> {
  const publisher = new NatsDiscoveryEventPublisher(natsUrl, subjectPrefix);
  await publisher['getConnection']();
  return publisher;
}
