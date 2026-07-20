# Marketplace API

REST API for the Lateen Marketplace service (port 4006).

## Health

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Service health |
| GET | `/metrics` | Metrics endpoint |

## Extensions

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/extensions` | List all extensions |
| GET | `/api/extensions/:extensionId` | Get extension by ID |

## Publishers

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/publishers` | List publishers |
| GET | `/api/publishers/:slug` | Get publisher by slug |

## Releases

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/releases?extensionId=` | List releases |
| GET | `/api/releases/:extensionId/latest` | Latest release |
| POST | `/api/releases/publish` | Publish release |

## Search

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/search` | Search extensions |

Query parameters: `q`, `category`, `publisher`, `industry`, `capability`, `connector`, `aiWorker`, `channel`, `tag`

## Install

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/install` | Install extension |

Headers: `x-organization-id`

Body:
```json
{
  "extensionId": "stripe-connector",
  "version": "1.0.0",
  "channel": "stable",
  "approvePermissions": ["integration:read"]
}
```

## Reviews

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/reviews/:extensionId` | List reviews |
| GET | `/api/reviews/:extensionId/ratings` | Rating summary |
| POST | `/api/reviews/:extensionId` | Create review |

## Headers

| Header | Description |
| ------ | ----------- |
| `x-organization-id` | Organization context for install/reviews |

## Manifest Validation

All publish requests validate manifests against `@lateen-os/extension-system` schema. Never accept duplicate manifest formats.
