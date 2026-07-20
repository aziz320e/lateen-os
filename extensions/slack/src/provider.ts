import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'slack',
    definitionCode: 'slack',
    displayName: 'Slack',
    category: 'MESSAGING',
    description: 'Slack workspace messaging',
    authMethods: ["OAUTH2","BEARER_TOKEN"],
    capabilities: ["messages","channels"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["messages","channels"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
