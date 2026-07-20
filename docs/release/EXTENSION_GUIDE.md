# Extension Guide — Lateen OS Enterprise v1.0.0-rc.1

## Extension Types

| Kind | Description |
| ---- | ----------- |
| connector | External system integration |
| workflow | Automation workflow |
| mission | Autonomous mission |
| ai-worker | AI worker definition |
| industry-pack | Vertical industry bundle |

## Manifest Schema (v1 — Frozen)

Extensions declare capabilities via `extension.json`:

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "kind": "connector",
  "permissions": ["read:products"],
  "capabilities": []
}
```

## Available Extensions (19)

Google Workspace · Microsoft 365 · Gmail · Outlook · Google Drive · OneDrive · Dropbox · Slack · Teams · WhatsApp Business · Shopify · Stripe · WooCommerce · PayPal · Odoo · HubSpot · QuickBooks · ERPNext · Printing Industry Pack

## Development

1. Use extension template from SDK
2. Implement adapter contracts
3. Register in extension registry
4. Test with extension-system package
5. Publish to marketplace

## Reference

- Extension system report: `docs/architecture/extension-system-report-v1.md`
- SDK Guide: [SDK_GUIDE.md](./SDK_GUIDE.md)
