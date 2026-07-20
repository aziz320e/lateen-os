import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'teams',
    definitionCode: 'microsoft-teams',
    displayName: 'Microsoft Teams',
    category: 'MESSAGING',
    description: 'Teams collaboration',
    authMethods: ["OAUTH2"],
    capabilities: ["messages","meetings"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["messages","meetings"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
