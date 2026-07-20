import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'shopify',
    definitionCode: 'shopify',
    displayName: 'Shopify',
    category: 'ECOMMERCE',
    description: 'Shopify store integration',
    authMethods: ["OAUTH2","API_KEY"],
    capabilities: ["orders","products","customers"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret","shopDomain"],
    entities: ["orders","products","customers"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
