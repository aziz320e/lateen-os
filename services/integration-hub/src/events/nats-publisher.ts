import { connect, type NatsConnection, StringCodec } from 'nats';
import type { IntegrationDomainEvent, IntegrationEventName } from '../domain/types';
import type { IntegrationEventPublisher } from '../domain/ports';

const sc = StringCodec();

export function buildEventSubject(prefix: string, eventName: IntegrationEventName): string {
  return `${prefix}.${eventName}`;
}

export class NatsIntegrationEventPublisher implements IntegrationEventPublisher {
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

  async publish(event: IntegrationDomainEvent): Promise<void> {
    if (!this.connection) await this.connect();
    const subject = buildEventSubject(this.subjectPrefix, event.eventName);
    this.connection!.publish(subject, sc.encode(JSON.stringify(event)));
    await this.connection!.flush();
  }
}

export class NoOpIntegrationEventPublisher implements IntegrationEventPublisher {
  async publish(_event: IntegrationDomainEvent): Promise<void> {
    /* no-op */
  }
}

export function createIntegrationEventPublisher(
  servers: string,
  subjectPrefix: string,
): NatsIntegrationEventPublisher {
  return new NatsIntegrationEventPublisher(servers, subjectPrefix);
}
