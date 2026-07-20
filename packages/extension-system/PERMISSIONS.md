# Extension Permissions

## Permission model

Extensions declare required permissions in `extension.json`. The sandbox enforces permissions at load and runtime.

## Available permissions

| Permission | Scope |
| ---------- | ----- |
| `filesystem:read` | Read extension directory |
| `filesystem:write` | Write extension directory |
| `network:outbound` | Outbound HTTP/API calls |
| `network:inbound` | Inbound webhooks |
| `business-dna:read` | Read Business DNA entities |
| `business-dna:write` | Write Business DNA entities |
| `workflow:read` | Read workflows |
| `workflow:write` | Create/update workflows |
| `decision:read` | Read decisions |
| `decision:write` | Create decisions |
| `identity:read` | Read identity data |
| `identity:write` | Manage identity |
| `memory:read` | Read institutional memory |
| `memory:write` | Write institutional memory |
| `ai-runtime:invoke` | Invoke AI Runtime agents |
| `integration-hub:read` | Read connectors |
| `integration-hub:write` | Manage connectors |
| `cli:register` | Register CLI commands |
| `events:publish` | Publish platform events |
| `events:subscribe` | Subscribe to platform events |

## Denied permissions

When a permission is denied, the system emits `permission.denied`:

```typescript
import { EXTENSION_EVENT_NAMES } from '@lateen-os/extension-system';

events.subscribe(EXTENSION_EVENT_NAMES.PermissionDenied, (event) => {
  console.log(event.payload.permission);
});
```

## Sandbox enforcement

| Limit | Default |
| ----- | ------- |
| Max memory | 256 MB |
| Max execution time | 30 seconds |
| Max network requests | 100 |
| Allowed hosts | localhost, 127.0.0.1 |

## SDK alignment

SDK plugin permissions (`read:business-dna`, etc.) map to extension-system permissions when extensions are generated via `@lateen-os/sdk`.
