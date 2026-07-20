import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'teams-connector',
  name: 'teams-connector',
  provider: 'microsoft-teams',
  version: '1.0.0',
  description: 'Teams collaboration',
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
    path: '/webhooks/microsoft-teams',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'MICROSOFT_TEAMS_WEBHOOK_SECRET',
  },
});
