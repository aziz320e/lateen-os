# AI Worker Development Guide

Wraps `@lateen-os/ai-workforce` worker contracts.

## Define a worker

```typescript
import { defineWorker } from '@lateen-os/sdk';

export default defineWorker({
  code: 'product-analyst',
  name: 'Product Analyst',
  description: 'Analyzes product opportunities',
  role: 'analyst',
  departmentCode: 'product',
  skills: [
    { id: 'market-research', name: 'Market Research', proficiency: '0.92' },
    { id: 'trend-analysis', name: 'Trend Analysis', proficiency: '0.88' },
  ],
  events: [
    { name: 'worker.assigned', description: 'Worker assigned to task' },
    { name: 'worker.completed', description: 'Task completed' },
  ],
});
```

## Worker lifecycle

Aligned with `@lateen-os/ai-workforce` lifecycle states:

```
registered → provisioned → activated → assigned → executing → reviewing → offboarded
```

## Lifecycle hooks

```typescript
import { createLateenSDK } from '@lateen-os/sdk';

const sdk = createLateenSDK({ workspaceRoot: process.cwd(), environment: 'development' });

const profile = sdk.workers.define({ /* ... */ });
const worker = sdk.workers.withLifecycle(profile, {
  onRegistered: async () => {},
  onActivated: async () => {},
  onAssigned: async () => {},
  onOffboarded: async () => {},
});
```

## Skills

Proficiency is a decimal string from `0` to `1` (e.g. `'0.85'`).

## Testing

```typescript
import { createMockWorker } from '@lateen-os/sdk';

const worker = createMockWorker({ code: 'test-worker', role: 'tester' });
```

## Scaffold

```bash
lateen-sdk create worker my-worker
```

## Integration with AI Brain

Workers are selected by `@lateen-os/ai-brain` routing (`WorkerRoute`, `WorkerPlan`). Define worker skills and role to align with brain orchestration.
