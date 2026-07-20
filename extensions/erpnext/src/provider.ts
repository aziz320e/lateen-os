import { createConnectorProvider, toProviderConfig } from '@lateen-os/connector-base';
import { connectorManifest } from './manifest.js';

const config = toProviderConfig(
  {
    folder: 'erpnext',
    definitionCode: 'erpnext',
    displayName: 'ERPNext',
    category: 'ERP',
    description: 'ERPNext integration',
    authMethods: ["API_KEY","BEARER_TOKEN"],
    capabilities: ["items","orders","invoices"],
    auth: connectorManifest.auth,
    authRequiredKeys: ["baseUrl","apiKey","apiSecret"],
    entities: ["items","orders","invoices"],
    syncModes: ["manual","scheduled","realtime","bidirectional"],
  },
  connectorManifest,
);

export const provider = createConnectorProvider(config);
export default provider;
