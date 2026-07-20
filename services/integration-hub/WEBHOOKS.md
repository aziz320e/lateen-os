# Webhooks

## Inbound (external → Lateen OS)

External systems POST events to the hub:

```http
POST /api/webhooks/inbound/{connectorId}
x-organization-id: {orgId}

{ "eventType": "payment.succeeded", "amount": 100 }
```

The hub validates connector ownership, records the payload, and publishes `WebhookReceived` on NATS.

## Outbound (Lateen OS → external)

Register a subscription for connector events:

```http
POST /api/webhooks
{
  "connectorId": "...",
  "eventType": "sync.completed",
  "targetUrl": "https://example.com/hooks/lateen",
  "secretRef": "vault:webhook-secret"
}
```

Deliveries are persisted as `WebhookDelivery` records in PostgreSQL.

## Authentication

Connectors supporting webhooks declare `WEBHOOK_SECRET` in auth methods (e.g. Stripe, WhatsApp Business). Secret verification is a contract stub in v1 — production verifies HMAC signatures before processing.

## Event types

Inbound payloads carry arbitrary JSON. Standard `eventType` strings are connector-specific (e.g. `payment.succeeded`, `message.received`).

## Integration with sync

Real-time webhooks can trigger sync jobs. v1 accepts and stores payloads; workflow triggers connect in future platform integration sprints.
