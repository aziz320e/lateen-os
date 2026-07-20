import { connect, type NatsConnection } from 'nats';
import type { AppConfig } from '../../config/index';
import type { AuditEvent } from '../../domain/types';

export class AuditPublisher {
  private connection: NatsConnection | null = null;

  constructor(private readonly config: AppConfig) {}

  async connect(): Promise<void> {
    if (!this.config.USE_NATS || this.config.NODE_ENV === 'test') return;
    try {
      this.connection = await connect({ servers: this.config.NATS_URL });
    } catch {
      this.connection = null;
    }
  }

  async publish(event: AuditEvent): Promise<void> {
    if (!this.connection) return;
    try {
      this.connection.publish('lateen.gateway.audit', JSON.stringify(event));
    } catch {
      // audit is best-effort
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.drain().catch(() => undefined);
      this.connection = null;
    }
  }
}
