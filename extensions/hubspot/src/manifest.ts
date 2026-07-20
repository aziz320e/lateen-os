import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'hubspot-connector',
  name: 'hubspot-connector',
  provider: 'hubspot',
  version: '1.0.0',
  description: 'CRM and marketing hub',
  auth: {
    "type": "oauth2",
    "config": {
      "clientId": "",
      "clientSecret": ""
    }
  },
  sync: { mode: 'bidirectional', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/hubspot',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'HUBSPOT_WEBHOOK_SECRET',
  },
});
