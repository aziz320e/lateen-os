import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'woocommerce-connector',
  name: 'woocommerce-connector',
  provider: 'woocommerce',
  version: '1.0.0',
  description: 'WooCommerce REST API',
  auth: {
    "type": "api_key",
    "config": {
      "siteUrl": "",
      "consumerKey": "",
      "consumerSecret": ""
    }
  },
  sync: { mode: 'pull', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/woocommerce',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'WOOCOMMERCE_WEBHOOK_SECRET',
  },
});
