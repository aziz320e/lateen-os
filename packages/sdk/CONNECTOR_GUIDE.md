# Connector Development Guide

Wraps Integration Hub connector patterns.

## Define a connector

```typescript
import { defineConnector } from '@lateen-os/sdk';

export default defineConnector({
  id: 'shopify-store',
  name: 'Shopify Store',
  provider: 'shopify',
  version: '1.0.0',
  description: 'Sync products and orders from Shopify',
  auth: {
    type: 'oauth2',
    config: {
      authorizeUrl: 'https://shopify.com/oauth/authorize',
      tokenUrl: 'https://shopify.com/oauth/token',
      scopes: 'read_products,read_orders',
    },
  },
  sync: {
    mode: 'pull',
    schedule: '0 */6 * * *',
    batchSize: 100,
  },
  webhook: {
    path: '/webhooks/shopify',
    events: ['orders/create', 'products/update'],
    secretEnvKey: 'SHOPIFY_WEBHOOK_SECRET',
  },
});
```

## Auth types

| Type | Use case |
| ---- | -------- |
| `none` | Public APIs |
| `api_key` | Header or query key |
| `oauth2` | OAuth 2.0 flows |
| `basic` | Username/password |
| `custom` | Provider-specific |

## Sync modes

| Mode | Description |
| ---- | ----------- |
| `pull` | Fetch data from external system |
| `push` | Send data to external system |
| `bidirectional` | Two-way sync |

## Validation

```typescript
import { validateManifest } from '@lateen-os/sdk';

const result = validateManifest('connector', connectorInput);
```

## Testing

```typescript
import { createMockConnector } from '@lateen-os/sdk';

const connector = createMockConnector({ id: 'test-api', provider: 'test' });
```

## Scaffold

```bash
lateen-sdk create connector my-connector
```

## Platform integration

Connectors integrate with `@lateen-os/integration-hub` service (port 4004). The SDK defines manifests only — implementation lives in the connector extension package.
