# Lateen SDK Guide

Architecture v1.0 (locked).

## Overview

The Lateen SDK (`@lateen-os/sdk`) is the **public developer interface** for extending Lateen OS. It provides:

- Strongly typed `define*` / `create*` helpers
- Zod validation for all manifests and definitions
- Event bus for extension communication
- CLI scaffolding via `lateen-sdk`
- Test utilities and mocks

## SDK entry point

```typescript
import { createLateenSDK } from '@lateen-os/sdk';

const sdk = createLateenSDK({
  workspaceRoot: '/path/to/lateen-os',
  environment: 'development',
  organizationId: '00000000-0000-4000-8000-000000000001',
  featureFlags: { betaFeatures: true },
});
```

`LateenSDK` exposes namespaced factories:

- `sdk.applications` — frontend apps
- `sdk.services` — backend services
- `sdk.plugins` — platform plugins
- `sdk.workers` — AI workers
- `sdk.workflows` — workflow definitions
- `sdk.missions` — multi-agent missions
- `sdk.connectors` — integration connectors
- `sdk.commands` — slash/CLI/assistant commands
- `sdk.config` — extension configuration
- `sdk.events` — in-process event bus

## Standalone define helpers

For simple extensions, use top-level helpers without instantiating the SDK:

```typescript
import { definePlugin, defineWorker, defineWorkflow } from '@lateen-os/sdk';
```

## Validation

All `define*` functions validate input with Zod and throw on invalid data.

```typescript
import { validateManifest, safeValidateSchema } from '@lateen-os/sdk';

const result = validateManifest('plugin', input);
if (!result.success) {
  console.error(result.error.flatten());
}
```

## Events

```typescript
import { SdkEventBus, publish, subscribe } from '@lateen-os/sdk';

const bus = new SdkEventBus();

const unsub = subscribe(bus, 'extension.ready', (event) => {
  console.log(event.payload);
});

publish(bus, 'extension.ready', { id: 'my-plugin' });
unsub();
```

## Testing

```typescript
import {
  createTestSdk,
  createMockService,
  createMockWorker,
  collectEvents,
} from '@lateen-os/sdk';
// or: import { createMockService } from '@lateen-os/sdk/testing';
```

## CLI scaffolding

```bash
lateen-sdk init                          # creates lateen.extension.json
lateen-sdk create plugin my-plugin       # scaffolds extensions/my-plugin/
lateen-sdk create worker my-worker
lateen-sdk doctor                        # validates SDK environment
```

## Architecture alignment

| SDK module | Platform package |
| ---------- | ---------------- |
| `workflow` | `@lateen-os/workflow-engine` |
| `mission` | `@lateen-os/multi-agent` |
| `worker` | `@lateen-os/ai-workforce` |
| `plugin` | `@lateen-os/kernel` |
| `events` | `@lateen-os/ai-brain` events convention |

## Non-goals

- Business logic execution
- LLM inference
- Database persistence
- Replacing platform services
