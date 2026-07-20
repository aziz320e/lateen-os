# Extension Manifest (`extension.json`)

## Required fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | string | Unique kebab-case identifier |
| `name` | string | Package name (kebab-case) |
| `displayName` | string | Human-readable name |
| `version` | semver | Extension version |
| `author` | string | Author name or org |
| `license` | string | SPDX license |
| `description` | string | Short description |
| `type` | enum | Extension type |
| `engineVersion` | semver | Required platform engine version |
| `sdkVersion` | semver | Required SDK version |

## Optional fields

| Field | Type | Description |
| ----- | ---- | ----------- |
| `homepage` | URL | Project homepage |
| `repository` | URL | Source repository |
| `category` | enum | productivity, analytics, integration, industry, ui, automation, ai, platform, other |
| `permissions` | string[] | Required permissions |
| `dependencies` | `{id, version}[]` | Required extensions |
| `optionalDependencies` | `{id, version}[]` | Optional extensions |
| `commands` | string[] | CLI commands registered |
| `routes` | string[] | HTTP routes |
| `events` | string[] | Events published/subscribed |
| `workers` | string[] | AI worker definitions |
| `missions` | string[] | Mission definitions |
| `connectors` | string[] | Connector definitions |
| `workflows` | string[] | Workflow definitions |
| `widgets` | string[] | Dashboard widgets |
| `themes` | string[] | UI themes |
| `industry` | string | Industry pack identifier |
| `main` | string | Entry module |
| `path` | string | Extension root path |

## Example

```json
{
  "id": "shopify-connector",
  "name": "shopify-connector",
  "displayName": "Shopify Connector",
  "version": "1.0.0",
  "author": "Acme Corp",
  "license": "MIT",
  "description": "Sync products and orders from Shopify",
  "category": "integration",
  "type": "connector",
  "engineVersion": "1.0.0",
  "sdkVersion": "1.0.0",
  "permissions": [
    "integration-hub:read",
    "integration-hub:write",
    "events:publish"
  ],
  "dependencies": [],
  "connectors": ["shopify"],
  "events": ["connector.sync.completed"]
}
```

## Validation

```bash
lateen extensions validate ./extensions/shopify-connector
```
