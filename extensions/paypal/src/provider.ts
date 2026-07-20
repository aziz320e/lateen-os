import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'paypal',
    definitionCode: 'paypal',
    displayName: 'PayPal',
    category: 'PAYMENTS',
    description: 'PayPal payments',
    authMethods: ["OAUTH2","API_KEY"],
    capabilities: ["payments","payouts"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret"],
    entities: ["payments","payouts"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
