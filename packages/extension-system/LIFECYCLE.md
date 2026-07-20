# Extension Lifecycle

## Registry status

| Status | Description |
| ------ | ----------- |
| `pending` | Installed but not enabled |
| `enabled` | Active and loadable |
| `disabled` | Installed but disabled |
| `failed` | Load or start failure |

## Lifecycle states

```
installing → installed → loading → loaded → starting → started
                │                      │
                ▼                      ▼
             removed ← stopping ← stopped
                │
                ▼
              failed
```

## Hooks

| Hook | When |
| ---- | ---- |
| `onInstall` | After files copied to extensions directory |
| `onLoad` | Before extension module loaded |
| `onStart` | After extension started |
| `onStop` | Before extension stopped |
| `onUpdate` | After version upgrade |
| `onRemove` | Before extension removed |

## CLI lifecycle commands

```bash
lateen extensions install ./path/to/ext   # → installing → installed
lateen extensions enable my-ext           # → pending → enabled
lateen extensions reload my-ext           # → load → unload → load (hot reload in dev)
lateen extensions disable my-ext          # → disabled
lateen extensions remove my-ext           # → removed
```

## Hot reload (development)

Set `LATEEN_EXTENSION_HOT_RELOAD=true` for development hot reload on `lateen extensions reload`.

## Kernel integration

When extensions are enabled, the Kernel registers them in its plugin registry for discovery and health checks. Lifecycle events propagate via the extension event bus.

## Events

| Event | When |
| ----- | ---- |
| `extension.installed` | Install complete |
| `extension.removed` | Extension removed |
| `extension.loaded` | Load complete |
| `extension.failed` | Any phase failure |
| `permission.denied` | Sandbox denied permission |
