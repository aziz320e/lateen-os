# SDK Guide — Lateen OS Enterprise v1.0.0-rc.1

## Package

`@lateen-os/sdk` — frozen at v1.0 for RC.

## Installation

```bash
pnpm add @lateen-os/sdk
```

## Core APIs

| Module | Purpose |
| ------ | ------- |
| `createClient` | Service client factory |
| `ExtensionManifest` | Extension manifest types |
| `WorkflowDefinition` | Workflow contract types |
| `MissionDefinition` | Mission contract types |
| `WorkerDefinition` | AI worker contract types |

## Extension Development

1. Create extension using template in `packages/extension-system/templates/`
2. Define manifest per schema v1
3. Register capabilities, workflows, missions
4. Test with `pnpm --filter @lateen-os/extension-system test`

## Service Integration

```typescript
import { createClient } from '@lateen-os/sdk';

const client = createClient({
  baseUrl: process.env.API_GATEWAY_URL,
  tenantId: 'tenant-1',
});
```

## Templates

| Template | Path |
| -------- | ---- |
| Extension | `packages/extension-system/templates/extension/` |
| Service | `packages/sdk/templates/service/` |
| Application | `packages/sdk/templates/app/` |

## Reference

- SDK report: `docs/architecture/sdk-report-v1.md`
- Extension system: `docs/architecture/extension-system-report-v1.md`
