import { defineConnector } from '@lateen-os/sdk';

export const connectorManifest = defineConnector({
  id: 'whatsapp-business-connector',
  name: 'whatsapp-business-connector',
  provider: 'whatsapp-business',
  version: '1.0.0',
  description: 'WhatsApp Business API',
  auth: {
    "type": "custom",
    "config": {
      "accessToken": "",
      "phoneNumberId": ""
    }
  },
  sync: { mode: 'pull', schedule: '0 */6 * * *', batchSize: 100 },
  webhook: {
    path: '/webhooks/whatsapp-business',
    events: ['installed', 'connected', 'disconnected', 'sync_started', 'sync_completed', 'sync_failed'],
    secretEnvKey: 'WHATSAPP_BUSINESS_WEBHOOK_SECRET',
  },
});
