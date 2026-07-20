# Structured logging standard for Lateen OS production

All services MUST emit JSON logs with these fields:

```json
{
  "timestamp": "2026-07-19T13:46:00.000Z",
  "level": "info",
  "service": "business-dna-service",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Request completed",
  "durationMs": 42,
  "method": "GET",
  "path": "/health",
  "statusCode": 200
}
```

## Correlation IDs

- Header: `x-correlation-id` (configured via `CORRELATION_ID_HEADER` in platform ConfigMap)
- Generate UUID v4 if missing on ingress
- Propagate to all downstream HTTP and NATS messages

## Collection

- OpenTelemetry Collector receives traces and forwards to logging exporter (dev) or Loki/CloudWatch (prod)
- Set `LATEEN_LOG_FORMAT=json` in platform ConfigMap

## Query examples (Loki)

```logql
{namespace="lateen-os"} | json | correlationId="550e8400-e29b-41d4-a716-446655440000"
{namespace="lateen-os", service="identity-service"} | json | level="error"
```
