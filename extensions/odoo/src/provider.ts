import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'odoo',
    definitionCode: 'odoo',
    displayName: 'Odoo',
    category: 'ERP',
    description: 'Open source ERP',
    authMethods: ["API_KEY","BASIC_AUTH"],
    capabilities: ["orders","inventory","accounting"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["baseUrl","apiKey","database"],
    entities: ["orders","products","inventory"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
