import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'stripe-connector',
  name: 'stripe-connector',
  provider: 'stripe',
  version: '1.0.0',
  description: 'Payment processing',
  auth: {
    "type": "api_key",
    "config": {
      "secretKey": ""
    }
  },
  sync: { mode: 'pull', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/stripe',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'STRIPE_WEBHOOK_SECRET',
  },
});
