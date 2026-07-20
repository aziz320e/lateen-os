import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'woocommerce',
    definitionCode: 'woocommerce',
    displayName: 'WooCommerce',
    category: 'ECOMMERCE',
    description: 'WooCommerce REST API',
    authMethods: ["API_KEY","BASIC_AUTH"],
    capabilities: ["orders","products"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["siteUrl","consumerKey","consumerSecret"],
    entities: ["orders","products"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
