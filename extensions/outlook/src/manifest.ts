import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'outlook-connector',
  name: 'outlook-connector',
  provider: 'outlook',
  version: '1.0.0',
  description: 'Microsoft Outlook mail',
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
    path: '/webhooks/outlook',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'OUTLOOK_WEBHOOK_SECRET',
  },
});
