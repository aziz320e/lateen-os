import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'quickbooks',
    definitionCode: 'quickbooks',
    displayName: 'QuickBooks',
    category: 'ACCOUNTING',
    description: 'Intuit QuickBooks accounting',
    authMethods: ["OAUTH2"],
    capabilities: ["invoices","accounts","customers"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["clientId","clientSecret","realmId"],
    entities: ["invoices","accounts","customers"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
