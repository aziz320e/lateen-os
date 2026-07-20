# @lateen-os/sdk — Lateen SDK

Official developer interface for extending Lateen OS (Architecture v1.0 locked).

The SDK wraps existing platform contracts into a strongly typed, validated developer experience. It contains **no business logic**.

## Install

```bash
pnpm add @lateen-os/sdk
```

## Quick start

```typescript
import {
  createLateenSDK,
  definePlugin,
  defineWorker,
  defineWorkflow,
} from '@lateen-os/sdk';

const sdk = createLateenSDK({
  workspaceRoot: process.cwd(),
  environment: 'development',
});

const plugin = sdk.plugins.define({
  id: 'my-extension',
  name: 'My Extension',
  version: '1.0.0',
  kind: 'package',
  path: 'extensions/my-extension',
  permissions: ['publish:events'],
  capabilities: ['reporting'],
});

const worker = defineWorker({
  code: 'research-analyst',
  name: 'Research Analyst',
  role: 'analyst',
  skills: [{ id: 'research', name: 'Research', proficiency: '0.9' }],
});
```

## CLI

```bash
pnpm --filter @lateen-os/sdk build
pnpm exec lateen-sdk init
pnpm exec lateen-sdk create plugin my-plugin
pnpm exec lateen-sdk create worker my-worker
pnpm exec lateen-sdk create connector my-connector
pnpm exec lateen-sdk create workflow my-workflow
pnpm exec lateen-sdk create mission my-mission
pnpm exec lateen-sdk doctor
```

## Modules

| Module | API |
| ------ | --- |
| `core` | `LateenSDK`, `SDKContext`, `SDKConfiguration` |
| `application` | `createApplication`, `defineApplication`, `registerRoutes/Pages/Widgets` |
| `service` | `createService`, `defineService`, `registerApi/Health/Events` |
| `plugin` | `definePlugin`, `PluginManifest`, permissions, lifecycle |
| `worker` | `defineWorker`, `WorkerProfile`, skills, events |
| `workflow` | `defineWorkflow`, steps, triggers |
| `mission` | `defineMission`, stages, outputs |
| `connector` | `defineConnector`, auth, sync, webhooks |
| `commands` | `defineCommand`, slash/CLI/assistant commands |
| `events` | `defineEvent`, `publish`, `subscribe` |
| `configuration` | `defineConfig`, feature flags |
| `validation` | Schema helpers, manifest & permission validation |
| `testing` | Mock service/worker/workflow/connector |

## Platform dependencies

Wraps contracts from: `@lateen-os/shared-kernel`, `@lateen-os/business-dna`, `@lateen-os/workflow-engine`, `@lateen-os/multi-agent`, `@lateen-os/ai-workforce`, `@lateen-os/ai-runtime`, `@lateen-os/ai-brain`, `@lateen-os/kernel`.

## Documentation

- [SDK_GUIDE.md](./SDK_GUIDE.md)
- [PLUGIN_GUIDE.md](./PLUGIN_GUIDE.md)
- [WORKER_GUIDE.md](./WORKER_GUIDE.md)
- [CONNECTOR_GUIDE.md](./CONNECTOR_GUIDE.md)

## Build

```bash
pnpm --filter @lateen-os/sdk build
pnpm --filter @lateen-os/sdk test
pnpm --filter @lateen-os/sdk typecheck
```
