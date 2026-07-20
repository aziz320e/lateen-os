import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'paypal-connector',
  name: 'paypal-connector',
  provider: 'paypal',
  version: '1.0.0',
  description: 'PayPal payments',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/paypal',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'PAYPAL_WEBHOOK_SECRET',
  },
});
