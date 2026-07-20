import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'odoo-connector',
  name: 'odoo-connector',
  provider: 'odoo',
  version: '1.0.0',
  description: 'Open source ERP',
  auth: {
    "type": "api_key",
    "config": {
      "baseUrl": "",
      "apiKey": "",
      "database": ""
    }
  },
  sync: { mode: 'pull', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/odoo',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'ODOO_WEBHOOK_SECRET',
  },
});
