import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'dropbox-connector',
  name: 'dropbox-connector',
  provider: 'dropbox',
  version: '1.0.0',
  description: 'Dropbox file sync',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/dropbox',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'DROPBOX_WEBHOOK_SECRET',
  },
});
