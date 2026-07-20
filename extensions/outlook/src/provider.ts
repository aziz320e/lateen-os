import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'outlook',
    definitionCode: 'outlook',
    displayName: 'Outlook',
    category: 'EMAIL',
    description: 'Microsoft Outlook mail',
    authMethods: ["OAUTH2","OIDC"],
    capabilities: ["email","send"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["messages"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
