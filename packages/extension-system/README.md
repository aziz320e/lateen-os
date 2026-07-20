# @lateen-os/extension-system

Official Lateen OS Extension System. Third-party developers extend the platform without modifying core code.

Extensions are **discovered**, **validated**, **loaded**, **versioned**, and **managed** by the Kernel.

No business logic.

## Extension types

`application` · `service` · `plugin` · `connector` · `workflow` · `mission` · `ai-worker` · `dashboard` · `widget` · `theme` · `industry-pack`

## Manifest (`extension.json`)

See [MANIFEST.md](./MANIFEST.md) for all fields.

## CLI (via Kernel)

```bash
lateen extensions list
lateen extensions install ./extensions/my-ext
lateen extensions remove my-ext
lateen extensions enable my-ext
lateen extensions disable my-ext
lateen extensions validate ./extensions/my-ext
lateen extensions reload my-ext
```

## Programmatic usage

```typescript
import { createExtensionSystem } from '@lateen-os/extension-system';

const system = createExtensionSystem(process.cwd());
await system.discoverAndRegister();
await system.loader.load('my-extension');
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MANIFEST.md](./MANIFEST.md)
- [PERMISSIONS.md](./PERMISSIONS.md)
- [LIFECYCLE.md](./LIFECYCLE.md)

## Build

```bash
pnpm --filter @lateen-os/extension-system build
pnpm --filter @lateen-os/extension-system test
pnpm --filter @lateen-os/extension-system typecheck
```
