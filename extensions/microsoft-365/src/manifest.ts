import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'microsoft-365-connector',
  name: 'microsoft-365-connector',
  provider: 'microsoft-365',
  version: '1.0.0',
  description: 'Outlook, Teams, and OneDrive',
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
    path: '/webhooks/microsoft-365',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'MICROSOFT_365_WEBHOOK_SECRET',
  },
});
