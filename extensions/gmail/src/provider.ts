import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'gmail',
    definitionCode: 'gmail',
    displayName: 'Gmail',
    category: 'EMAIL',
    description: 'Gmail API integration',
    authMethods: ["OAUTH2"],
    capabilities: ["email","send","labels"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["messages","labels"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
