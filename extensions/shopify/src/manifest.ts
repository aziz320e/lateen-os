import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'shopify-connector',
  name: 'shopify-connector',
  provider: 'shopify',
  version: '1.0.0',
  description: 'Shopify store integration',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": "",
      "shopDomain": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/shopify',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'SHOPIFY_WEBHOOK_SECRET',
  },
});
