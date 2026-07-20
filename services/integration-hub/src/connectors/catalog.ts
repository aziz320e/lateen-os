import type { AuthMethod, ConnectorCategory, ConnectorDefinition } from '../domain/types';

/** Static connector catalog — contract definitions only (no live API integration). */

export const CONNECTOR_CATALOG: ConnectorDefinition[] = [
  def('google-workspace', 'Google Workspace', 'EMAIL', 'Google mail, calendar, and drive suite', ['OAUTH2', 'OIDC'], ['email', 'calendar', 'contacts']),
  def('microsoft-365', 'Microsoft 365', 'EMAIL', 'Outlook, Teams, and OneDrive', ['OAUTH2', 'OIDC'], ['email', 'calendar', 'storage']),
  def('gmail', 'Gmail', 'EMAIL', 'Gmail API integration', ['OAUTH2'], ['email', 'send', 'labels']),
  def('outlook', 'Outlook', 'EMAIL', 'Microsoft Outlook mail', ['OAUTH2', 'OIDC'], ['email', 'send']),
  def('google-drive', 'Google Drive', 'STORAGE', 'Cloud file storage', ['OAUTH2'], ['files', 'upload', 'download']),
  def('onedrive', 'OneDrive', 'STORAGE', 'Microsoft cloud storage', ['OAUTH2'], ['files', 'upload']),
  def('dropbox', 'Dropbox', 'STORAGE', 'Dropbox file sync', ['OAUTH2', 'API_KEY'], ['files', 'sync']),
  def('whatsapp-business', 'WhatsApp Business', 'MESSAGING', 'WhatsApp Business API', ['BEARER_TOKEN', 'WEBHOOK_SECRET'], ['messages', 'templates']),
  def('slack', 'Slack', 'MESSAGING', 'Slack workspace messaging', ['OAUTH2', 'BEARER_TOKEN'], ['messages', 'channels']),
  def('microsoft-teams', 'Microsoft Teams', 'MESSAGING', 'Teams collaboration', ['OAUTH2'], ['messages', 'meetings']),
  def('shopify', 'Shopify', 'ECOMMERCE', 'Shopify store integration', ['OAUTH2', 'API_KEY'], ['orders', 'products', 'customers']),
  def('woocommerce', 'WooCommerce', 'ECOMMERCE', 'WooCommerce REST API', ['API_KEY', 'BASIC_AUTH'], ['orders', 'products']),
  def('stripe', 'Stripe', 'PAYMENTS', 'Payment processing', ['API_KEY', 'WEBHOOK_SECRET'], ['payments', 'subscriptions', 'webhooks']),
  def('paypal', 'PayPal', 'PAYMENTS', 'PayPal payments', ['OAUTH2', 'API_KEY'], ['payments', 'payouts']),
  def('hubspot', 'HubSpot', 'CRM', 'CRM and marketing hub', ['OAUTH2', 'API_KEY'], ['contacts', 'deals', 'companies']),
  def('odoo', 'Odoo', 'ERP', 'Open source ERP', ['API_KEY', 'BASIC_AUTH'], ['orders', 'inventory', 'accounting']),
  def('erpnext', 'ERPNext', 'ERP', 'ERPNext integration', ['API_KEY', 'BEARER_TOKEN'], ['items', 'orders', 'invoices']),
  def('sap', 'SAP', 'ERP', 'SAP enterprise connector (contract)', ['OAUTH2', 'BASIC_AUTH'], ['orders', 'materials']),
  def('quickbooks', 'QuickBooks', 'ACCOUNTING', 'Intuit QuickBooks accounting', ['OAUTH2'], ['invoices', 'accounts', 'customers']),
  def('openai', 'OpenAI', 'AI_PROVIDERS', 'OpenAI models API', ['API_KEY', 'BEARER_TOKEN'], ['chat', 'embeddings']),
  def('anthropic', 'Anthropic', 'AI_PROVIDERS', 'Claude models API', ['API_KEY', 'BEARER_TOKEN'], ['chat']),
  def('azure-openai', 'Azure OpenAI', 'AI_PROVIDERS', 'Azure-hosted OpenAI', ['API_KEY', 'BEARER_TOKEN'], ['chat', 'embeddings']),
  def('custom-rest', 'Custom REST', 'CUSTOM_REST', 'Generic REST API connector', ['API_KEY', 'BEARER_TOKEN', 'BASIC_AUTH'], ['pull', 'push']),
  def('custom-graphql', 'Custom GraphQL', 'GRAPHQL', 'Generic GraphQL connector', ['API_KEY', 'BEARER_TOKEN'], ['query', 'mutation']),
];

function def(
  code: string,
  name: string,
  category: ConnectorCategory,
  description: string,
  authMethods: AuthMethod[],
  capabilities: string[],
): ConnectorDefinition {
  return {
    id: code,
    code,
    name,
    category,
    description,
    version: '1.0.0',
    authMethods,
    capabilities,
  };
}

export function getConnectorDefinition(code: string): ConnectorDefinition | undefined {
  return CONNECTOR_CATALOG.find((c) => c.code === code);
}

export function listByCategory(category: ConnectorCategory): ConnectorDefinition[] {
  return CONNECTOR_CATALOG.filter((c) => c.category === category);
}
