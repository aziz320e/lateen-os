import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'onedrive',
    definitionCode: 'onedrive',
    displayName: 'OneDrive',
    category: 'STORAGE',
    description: 'Microsoft cloud storage',
    authMethods: ["OAUTH2"],
    capabilities: ["files","upload"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["files"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
