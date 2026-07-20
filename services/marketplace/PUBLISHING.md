# Publishing Extensions

Guide for publishing extensions to the Lateen Marketplace.

## Prerequisites

1. Valid `extension.json` manifest (Extension System schema)
2. Publisher account on the Marketplace
3. Lateen SDK for development

## Manifest

Never duplicate the manifest schema. Use `@lateen-os/extension-system`:

```json
{
  "id": "my-extension",
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "author": "Your Organization",
  "license": "MIT",
  "description": "Extension description",
  "category": "integration",
  "type": "connector",
  "engineVersion": "1.0.0",
  "sdkVersion": "1.0.0",
  "permissions": [],
  "dependencies": []
}
```

## Validate Before Publish

```bash
lateen extensions validate ./path/to/extension
```

## Publish via CLI

```bash
lateen marketplace publish ./extensions/my-extension --channel stable
```

## Publish via API

```http
POST /api/releases/publish
Content-Type: application/json

{
  "publisherId": "<publisher-uuid>",
  "manifest": { ... },
  "channel": "stable",
  "releaseNotes": "Initial release",
  "license": {
    "type": "free",
    "priceCents": 0,
    "currency": "USD"
  }
}
```

## Versioning

- Semantic versioning required (`MAJOR.MINOR.PATCH`)
- Channels: `stable`, `beta`, `alpha`, `nightly`
- One release per version + channel combination

## Distribution

| Mode | Description |
| ---- | ----------- |
| `public` | Visible to all organizations |
| `private` | Organization-scoped |
| `enterprise` | Enterprise license required |

## Unpublish / Archive

Update extension visibility via API:

- `published` — live on marketplace
- `unpublished` — hidden from search
- `archived` — deprecated, no new installs
