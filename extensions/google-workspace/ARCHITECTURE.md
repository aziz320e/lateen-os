# Google Workspace — Architecture

Extension type: `connector`  
Hub definition code: `google-workspace`  
Category: `EMAIL`

## Components

| Export | Description |
| ------ | ----------- |
| `connectorManifest` | SDK `ConnectorManifest` via `defineConnector` |
| `provider` | Full `ConnectorProvider` with auth, health, sync, webhooks |
| `syncAdapter` | Pull/push sync with retry and rate-limit handling |
| `webhookAdapter` | Webhook registration and event parsing |
| `healthAdapter` | Connection health monitoring |

Built on `@lateen-os/connector-base`. No business logic.
