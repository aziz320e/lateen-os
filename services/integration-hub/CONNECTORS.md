# Connectors

## Registry types

| Type | Description |
| ---- | ----------- |
| `ConnectorDefinition` | Static catalog entry (code, category, auth methods, capabilities) |
| `ConnectorInstance` | Installed connector for an organization |
| `ConnectorConfiguration` | Settings + auth method + optional webhook URL |
| `ConnectorStatus` | INSTALLED → CONFIGURED → AUTHENTICATED → ENABLED / DISABLED |
| `ConnectorHealth` | healthy / degraded / down + latency + success rate |
| `ConnectorCategory` | ERP, CRM, ECOMMERCE, ACCOUNTING, EMAIL, MESSAGING, STORAGE, CALENDAR, PAYMENTS, MARKETING, AI_PROVIDERS, CUSTOM_REST, GRAPHQL |

## Categories and connectors

| Category | Connectors |
| -------- | ---------- |
| Email | Google Workspace, Microsoft 365, Gmail, Outlook |
| Storage | Google Drive, OneDrive, Dropbox |
| Messaging | WhatsApp Business, Slack, Microsoft Teams |
| E-commerce | Shopify, WooCommerce |
| Payments | Stripe, PayPal |
| CRM | HubSpot |
| ERP | Odoo, ERPNext, SAP |
| Accounting | QuickBooks |
| AI Providers | OpenAI, Anthropic, Azure OpenAI |
| Custom | Custom REST, Custom GraphQL |

## Lifecycle API

```http
POST /api/connectors
{ "definitionCode": "stripe", "configuration": { "settings": {} } }

POST /api/connectors/{id}/lifecycle
{ "action": "authenticate" }
```

Actions: `install`, `configure`, `authenticate`, `test`, `enable`, `disable`, `upgrade`, `remove`.

## Mock providers

Each connector code maps to `MockConnectorProvider` which simulates:

- `testConnection()` — always succeeds in v1
- `authenticate()` — returns mock credentials ref
- `pull()` — returns one mock record
- `push()` — accepts all records

No HTTP calls are made.
