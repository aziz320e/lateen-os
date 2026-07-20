import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'onedrive-connector',
  name: 'onedrive-connector',
  provider: 'onedrive',
  version: '1.0.0',
  description: 'Microsoft cloud storage',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": "",
      "tenantId": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/onedrive',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'ONEDRIVE_WEBHOOK_SECRET',
  },
});
