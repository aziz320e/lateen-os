import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'slack-connector',
  name: 'slack-connector',
  provider: 'slack',
  version: '1.0.0',
  description: 'Slack workspace messaging',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/slack',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'SLACK_WEBHOOK_SECRET',
  },
});
