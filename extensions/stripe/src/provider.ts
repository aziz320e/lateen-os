import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'stripe',
    definitionCode: 'stripe',
    displayName: 'Stripe',
    category: 'PAYMENTS',
    description: 'Payment processing',
    authMethods: ["API_KEY","WEBHOOK_SECRET"],
    capabilities: ["payments","subscriptions","webhooks"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["secretKey"],
    entities: ["payments","customers","subscriptions"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
