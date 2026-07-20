import type {
  AuthMethod,
  ConnectorCategory,
  SyncMode,
  WebhookEventType,
} from '@lateen-os/integration-contracts';
import type { ConnectorAuth } from '@lateen-os/sdk';
import type { ProviderConfig } from '../base-provider.js';

export interface ProviderDefinition {
  readonly folder: string;
  readonly definitionCode: string;
  readonly displayName: string;
  readonly category: ConnectorCategory;
  readonly description: string;
  readonly authMethods: readonly AuthMethod[];
  readonly capabilities: readonly string[];
  readonly auth: ConnectorAuth;
  readonly authRequiredKeys: readonly string[];
  readonly entities: readonly string[];
  readonly syncModes: readonly SyncMode[];
  readonly openapiSpecUrl?: string;
}

const DEFAULT_WEBHOOK_EVENTS: WebhookEventType[] = [
  'installed',
  'connected',
  'disconnected',
  'sync_started',
  'sync_completed',
  'sync_failed',
];

export const PROVIDER_DEFINITIONS: ProviderDefinition[] = [
  provider('google-workspace', 'google-workspace', 'Google Workspace', 'EMAIL', 'Google mail, calendar, and drive suite', ['OAUTH2', 'OIDC'], ['email', 'calendar', 'contacts'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['email', 'calendar', 'contacts']),
  provider('microsoft-365', 'microsoft-365', 'Microsoft 365', 'EMAIL', 'Outlook, Teams, and OneDrive', ['OAUTH2', 'OIDC'], ['email', 'calendar', 'storage'], oauth2(['clientId', 'clientSecret', 'tenantId']), ['clientId', 'clientSecret', 'tenantId'], ['email', 'calendar', 'files']),
  provider('gmail', 'gmail', 'Gmail', 'EMAIL', 'Gmail API integration', ['OAUTH2'], ['email', 'send', 'labels'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['messages', 'labels']),
  provider('outlook', 'outlook', 'Outlook', 'EMAIL', 'Microsoft Outlook mail', ['OAUTH2', 'OIDC'], ['email', 'send'], oauth2(['clientId', 'clientSecret', 'tenantId']), ['clientId', 'clientSecret'], ['messages']),
  provider('google-drive', 'google-drive', 'Google Drive', 'STORAGE', 'Cloud file storage', ['OAUTH2'], ['files', 'upload', 'download'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['files']),
  provider('onedrive', 'onedrive', 'OneDrive', 'STORAGE', 'Microsoft cloud storage', ['OAUTH2'], ['files', 'upload'], oauth2(['clientId', 'clientSecret', 'tenantId']), ['clientId', 'clientSecret'], ['files']),
  provider('dropbox', 'dropbox', 'Dropbox', 'STORAGE', 'Dropbox file sync', ['OAUTH2', 'API_KEY'], ['files', 'sync'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['files']),
  provider('slack', 'slack', 'Slack', 'MESSAGING', 'Slack workspace messaging', ['OAUTH2', 'BEARER_TOKEN'], ['messages', 'channels'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['messages', 'channels']),
  provider('teams', 'microsoft-teams', 'Microsoft Teams', 'MESSAGING', 'Teams collaboration', ['OAUTH2'], ['messages', 'meetings'], oauth2(['clientId', 'clientSecret', 'tenantId']), ['clientId', 'clientSecret'], ['messages', 'meetings']),
  provider('whatsapp-business', 'whatsapp-business', 'WhatsApp Business', 'MESSAGING', 'WhatsApp Business API', ['BEARER_TOKEN', 'WEBHOOK_SECRET'], ['messages', 'templates'], bearer(['accessToken', 'phoneNumberId']), ['accessToken', 'phoneNumberId'], ['messages']),
  provider('shopify', 'shopify', 'Shopify', 'ECOMMERCE', 'Shopify store integration', ['OAUTH2', 'API_KEY'], ['orders', 'products', 'customers'], oauth2(['clientId', 'clientSecret', 'shopDomain']), ['clientId', 'clientSecret', 'shopDomain'], ['orders', 'products', 'customers']),
  provider('woocommerce', 'woocommerce', 'WooCommerce', 'ECOMMERCE', 'WooCommerce REST API', ['API_KEY', 'BASIC_AUTH'], ['orders', 'products'], apiKey(['siteUrl', 'consumerKey', 'consumerSecret']), ['siteUrl', 'consumerKey', 'consumerSecret'], ['orders', 'products']),
  provider('stripe', 'stripe', 'Stripe', 'PAYMENTS', 'Payment processing', ['API_KEY', 'WEBHOOK_SECRET'], ['payments', 'subscriptions', 'webhooks'], apiKey(['secretKey']), ['secretKey'], ['payments', 'customers', 'subscriptions']),
  provider('paypal', 'paypal', 'PayPal', 'PAYMENTS', 'PayPal payments', ['OAUTH2', 'API_KEY'], ['payments', 'payouts'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['payments', 'payouts']),
  provider('hubspot', 'hubspot', 'HubSpot', 'CRM', 'CRM and marketing hub', ['OAUTH2', 'API_KEY'], ['contacts', 'deals', 'companies'], oauth2(['clientId', 'clientSecret']), ['clientId', 'clientSecret'], ['contacts', 'deals', 'companies']),
  provider('odoo', 'odoo', 'Odoo', 'ERP', 'Open source ERP', ['API_KEY', 'BASIC_AUTH'], ['orders', 'inventory', 'accounting'], apiKey(['baseUrl', 'apiKey', 'database']), ['baseUrl', 'apiKey', 'database'], ['orders', 'products', 'inventory']),
  provider('erpnext', 'erpnext', 'ERPNext', 'ERP', 'ERPNext integration', ['API_KEY', 'BEARER_TOKEN'], ['items', 'orders', 'invoices'], apiKey(['baseUrl', 'apiKey', 'apiSecret']), ['baseUrl', 'apiKey', 'apiSecret'], ['items', 'orders', 'invoices']),
  provider('quickbooks', 'quickbooks', 'QuickBooks', 'ACCOUNTING', 'Intuit QuickBooks accounting', ['OAUTH2'], ['invoices', 'accounts', 'customers'], oauth2(['clientId', 'clientSecret', 'realmId']), ['clientId', 'clientSecret', 'realmId'], ['invoices', 'accounts', 'customers']),
];

function oauth2(keys: string[]): ConnectorAuth {
  return { type: 'oauth2', config: Object.fromEntries(keys.map((k) => [k, ''])) };
}

function apiKey(keys: string[]): ConnectorAuth {
  return { type: 'api_key', config: Object.fromEntries(keys.map((k) => [k, ''])) };
}

function bearer(keys: string[]): ConnectorAuth {
  return { type: 'custom', config: Object.fromEntries(keys.map((k) => [k, ''])) };
}

function provider(
  folder: string,
  definitionCode: string,
  displayName: string,
  category: ConnectorCategory,
  description: string,
  authMethods: AuthMethod[],
  capabilities: string[],
  auth: ConnectorAuth,
  authRequiredKeys: string[],
  entities: string[],
): ProviderDefinition {
  return {
    folder,
    definitionCode,
    displayName,
    category,
    description,
    authMethods,
    capabilities,
    auth,
    authRequiredKeys,
    entities,
    syncModes: ['manual', 'scheduled', 'realtime', 'bidirectional'],
  };
}

export function toProviderConfig(def: ProviderDefinition, manifest: import('@lateen-os/sdk').ConnectorManifest): ProviderConfig {
  return {
    definitionCode: def.definitionCode,
    manifest,
    metadata: {
      definitionCode: def.definitionCode,
      displayName: def.displayName,
      category: def.category,
      description: def.description,
      version: manifest.version,
      authMethods: def.authMethods,
      capabilities: def.capabilities,
      openapiSpecUrl: def.openapiSpecUrl,
    },
    authRequiredKeys: def.authRequiredKeys,
    entities: def.entities,
    syncModes: def.syncModes,
    webhookEvents: DEFAULT_WEBHOOK_EVENTS,
    openapiSpecUrl: def.openapiSpecUrl,
  };
}

export function getProviderDefinition(folder: string): ProviderDefinition | undefined {
  return PROVIDER_DEFINITIONS.find((d) => d.folder === folder);
}
