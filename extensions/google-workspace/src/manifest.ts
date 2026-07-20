import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'google-workspace-connector',
  name: 'google-workspace-connector',
  provider: 'google-workspace',
  version: '1.0.0',
  description: 'Google mail, calendar, and drive suite',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/google-workspace',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'GOOGLE_WORKSPACE_WEBHOOK_SECRET',
  },
});
