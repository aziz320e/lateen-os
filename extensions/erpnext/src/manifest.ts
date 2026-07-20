import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'erpnext-connector',
  name: 'erpnext-connector',
  provider: 'erpnext',
  version: '1.0.0',
  description: 'ERPNext integration',
  auth: {
    "type": "api_key",
    "config": {
      "baseUrl": "",
      "apiKey": "",
      "apiSecret": ""
    }
  },
  sync: { mode: 'pull', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/erpnext',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'ERPNEXT_WEBHOOK_SECRET',
  },
});
