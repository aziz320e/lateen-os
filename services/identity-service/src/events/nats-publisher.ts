import { connect, type NatsConnection, StringCodec } from 'nats';
import type { IdentityDomainEvent, IdentityEventName } from '../domain/types';
import type { IdentityEventPublisher } from '../domain/ports';

const sc = StringCodec();

export function buildEventSubject(prefix: string, eventName: IdentityEventName): string {
  return `${prefix}.${eventName}`;
}

export class NatsIdentityEventPublisher implements IdentityEventPublisher {
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

  async publish(event: IdentityDomainEvent): Promise<void> {
    if (!this.connection) await this.connect();
    const subject = buildEventSubject(this.subjectPrefix, event.eventName);
    this.connection!.publish(subject, sc.encode(JSON.stringify(event)));
    await this.connection!.flush();
  }
}

export class NoOpIdentityEventPublisher implements IdentityEventPublisher {
  async publish(_event: IdentityDomainEvent): Promise<void> {
    /* no-op */
  }
}

export function createIdentityEventPublisher(
  servers: string,
  subjectPrefix: string,
): NatsIdentityEventPublisher {
  return new NatsIdentityEventPublisher(servers, subjectPrefix);
}

export function createDomainEvent(
  eventName: IdentityEventName,
  payload: Record<string, unknown>,
  organizationId?: string,
): IdentityDomainEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName,
    occurredAt: new Date().toISOString(),
    organizationId,
    payload,
  };
}
