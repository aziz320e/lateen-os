import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'whatsapp-business',
    definitionCode: 'whatsapp-business',
    displayName: 'WhatsApp Business',
    category: 'MESSAGING',
    description: 'WhatsApp Business API',
    authMethods: ["BEARER_TOKEN","WEBHOOK_SECRET"],
    capabilities: ["messages","templates"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["accessToken","phoneNumberId"],
    entities: ["messages"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
