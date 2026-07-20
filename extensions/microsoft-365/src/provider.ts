import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'microsoft-365',
    definitionCode: 'microsoft-365',
    displayName: 'Microsoft 365',
    category: 'EMAIL',
    description: 'Outlook, Teams, and OneDrive',
    authMethods: ["OAUTH2","OIDC"],
    capabilities: ["email","calendar","storage"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret","tenantId"],
    entities: ["email","calendar","files"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
