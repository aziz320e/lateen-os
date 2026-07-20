import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'quickbooks-connector',
  name: 'quickbooks-connector',
  provider: 'quickbooks',
  version: '1.0.0',
  description: 'Intuit QuickBooks accounting',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": "",
      "realmId": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/quickbooks',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'QUICKBOOKS_WEBHOOK_SECRET',
  },
});
