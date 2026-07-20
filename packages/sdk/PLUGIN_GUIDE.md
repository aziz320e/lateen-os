# Plugin Development Guide

## Define a plugin

```typescript
import { definePlugin } from '@lateen-os/sdk';

export default definePlugin({
  id: 'analytics-dashboard',
  name: 'Analytics Dashboard',
  version: '1.0.0',
  kind: 'application',
  path: 'extensions/analytics-dashboard',
  description: 'Custom analytics views',
  dependencies: [],
  permissions: [
    'read:business-dna',
    'read:workflows',
    'publish:events',
  ],
  capabilities: ['dashboard', 'charts'],
});
```

## Plugin kinds

| Kind | Purpose |
| ---- | ------- |
| `application` | Next.js frontend extension |
| `service` | Backend service extension |
| `package` | Shared library extension |
| `ai-worker` | AI workforce worker |
| `connector` | Integration connector |
| `workflow` | Workflow template |
| `mission` | Multi-agent mission template |

## Permissions

| Permission | Access |
| ---------- | ------ |
| `read:business-dna` | Read Business DNA entities |
| `write:business-dna` | Write Business DNA entities |
| `read:workflows` | Read workflow definitions |
| `write:workflows` | Create/update workflows |
| `read:missions` | Read missions |
| `write:missions` | Create/update missions |
| `read:workers` | Read AI workers |
| `write:workers` | Manage AI workers |
| `read:connectors` | Read connectors |
| `write:connectors` | Manage connectors |
| `publish:events` | Publish platform events |
| `subscribe:events` | Subscribe to platform events |

## Validate permissions

```typescript
import { definePlugin, validatePermissions } from '@lateen-os/sdk';

const plugin = definePlugin({ /* ... */ });
const check = validatePermissions(plugin, ['read:workflows', 'publish:events']);
if (!check.valid) {
  console.log('Missing:', check.missing);
}
```

## Lifecycle hooks

```typescript
import { createLateenSDK } from '@lateen-os/sdk';

const sdk = createLateenSDK({ workspaceRoot: process.cwd(), environment: 'development' });

const manifest = sdk.plugins.define({ /* ... */ });
const plugin = sdk.plugins.withLifecycle(manifest, {
  onRegister: async () => console.log('registered'),
  onActivate: async () => console.log('activated'),
  onDeactivate: async () => console.log('deactivated'),
});
```

## Scaffold

```bash
lateen-sdk create plugin my-plugin
```

Generates `extensions/my-plugin/` with `package.json`, `tsconfig.json`, and `src/index.ts`.

## Registration with Kernel

Plugins align with `@lateen-os/kernel` plugin registry kinds. Register via kernel CLI:

```bash
lateen plugins list
```
