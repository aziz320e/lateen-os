import { randomUUID } from 'node:crypto';
import type { IntegrationDomainEvent, WebhookPayload } from '../domain/types';
import type { ConnectorRepositoryPort, IntegrationEventPublisher, WebhookRepositoryPort } from '../domain/ports';

export class WebhookService {
  constructor(
    private readonly connectors: ConnectorRepositoryPort,
    private readonly webhooks: WebhookRepositoryPort,
    private readonly events: IntegrationEventPublisher,
  ) {}

  async register(input: {
    connectorId: string;
    organizationId: string;
    eventType: string;
    targetUrl: string;
    secretRef?: string;
  }) {
    const connector = await this.connectors.getConnector(input.connectorId, input.organizationId);
    if (!connector) throw new Error('Connector not found');
    return this.webhooks.registerWebhook(input);
  }

  async receiveInbound(connectorId: string, organizationId: string, body: Record<string, unknown>): Promise<WebhookPayload> {
    const connector = await this.connectors.getConnector(connectorId, organizationId);
    if (!connector) throw new Error('Connector not found');

    const payload: WebhookPayload = {
      eventType: String(body.eventType ?? 'unknown'),
      connectorId,
      payload: body,
      receivedAt: new Date().toISOString(),
    };

    const event: IntegrationDomainEvent = {
      eventId: randomUUID(),
      eventName: 'WebhookReceived',
      organizationId,
      occurredAt: payload.receivedAt,
      payload: { connectorId, eventType: payload.eventType },
    };
    await this.events.publish(event);

    return payload;
  }
}
