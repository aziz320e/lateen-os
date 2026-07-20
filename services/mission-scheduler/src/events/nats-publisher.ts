import { connect, type NatsConnection, StringCodec } from 'nats';
import type { SchedulerDomainEvent, SchedulerEventName } from '../domain/types';
import type { SchedulerEventPublisher } from '../domain/ports';

const sc = StringCodec();

export function buildEventSubject(prefix: string, eventName: SchedulerEventName): string {
  return `${prefix}.${eventName}`;
}

export class NatsSchedulerEventPublisher implements SchedulerEventPublisher {
  private connection: NatsConnection | null = null;

  constructor(
    private readonly servers: string,
    private readonly subjectPrefix: string,
  ) {}

  async connect(): Promise<void> {
    if (!this.connection) this.connection = await connect({ servers: this.servers });
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain();
      this.connection = null;
    }
  }

  async publish(event: SchedulerDomainEvent): Promise<void> {
    if (!this.connection) await this.connect();
    const subject = buildEventSubject(this.subjectPrefix, event.eventName);
    this.connection!.publish(subject, sc.encode(JSON.stringify(event)));
    await this.connection!.flush();
  }
}

export class NoOpSchedulerEventPublisher implements SchedulerEventPublisher {
  async publish(_event: SchedulerDomainEvent): Promise<void> {}
}

export function createSchedulerEventPublisher(servers: string, subjectPrefix: string): NatsSchedulerEventPublisher {
  return new NatsSchedulerEventPublisher(servers, subjectPrefix);
}
