import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'dropbox',
    definitionCode: 'dropbox',
    displayName: 'Dropbox',
    category: 'STORAGE',
    description: 'Dropbox file sync',
    authMethods: ["OAUTH2","API_KEY"],
    capabilities: ["files","sync"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["files"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
