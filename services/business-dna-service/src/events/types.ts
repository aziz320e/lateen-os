import type { DomainEventPublisher } from '../domain/ports.js';

export interface NatsEventPublisherConfig {
  readonly servers: string;
  readonly subjectPrefix: string;
}

export interface NatsDomainEventPublisher extends DomainEventPublisher {
  connect(): Promise<void>;
  close(): Promise<void>;
}

export function buildEventSubject(prefix: string, eventName: string): string {
  return `${prefix}.${eventName.replace(/\./g, '_')}`;
}
