import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'google-drive-connector',
  name: 'google-drive-connector',
  provider: 'google-drive',
  version: '1.0.0',
  description: 'Cloud file storage',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/google-drive',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'GOOGLE_DRIVE_WEBHOOK_SECRET',
  },
});
