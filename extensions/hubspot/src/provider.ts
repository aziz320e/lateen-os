import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'hubspot',
    definitionCode: 'hubspot',
    displayName: 'HubSpot',
    category: 'CRM',
    description: 'CRM and marketing hub',
    authMethods: ["OAUTH2","API_KEY"],
    capabilities: ["contacts","deals","companies"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["contacts","deals","companies"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
