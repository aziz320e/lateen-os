import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'google-drive',
    definitionCode: 'google-drive',
    displayName: 'Google Drive',
    category: 'STORAGE',
    description: 'Cloud file storage',
    authMethods: ["OAUTH2"],
    capabilities: ["files","upload","download"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["files"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
