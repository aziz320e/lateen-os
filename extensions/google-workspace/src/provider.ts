import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'google-workspace',
    definitionCode: 'google-workspace',
    displayName: 'Google Workspace',
    category: 'EMAIL',
    description: 'Google mail, calendar, and drive suite',
    authMethods: ["OAUTH2","OIDC"],
    capabilities: ["email","calendar","contacts"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["email","calendar","contacts"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
