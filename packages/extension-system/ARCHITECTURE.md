# Extension System — Architecture

Architecture v1.0 (locked).

## Platform position

```
Third-party extension (extension.json)
        │
        ▼
Extension System (@lateen-os/extension-system)
  Discovery → Validation → Registry → Loader → Sandbox
        │
        ▼
Lateen Kernel (@lateen-os/kernel)
  Plugin registry · Lifecycle · Health · CLI
        │
        ▼
Platform services (Business DNA, Workflow Engine, etc.)
```

## Modules

| Module | Responsibility |
| ------ | -------------- |
| `manifest` | `extension.json` schema (Zod) + parser |
| `discovery` | Scan `/extensions`, `/packages`, `/apps`, `/services`, marketplace cache |
| `registry` | Installed extensions (enabled/disabled/failed/pending) |
| `validator` | Manifest, permission, compatibility validation |
| `dependencies` | Semver resolution, cycles, missing deps |
| `loader` | Load, unload, reload, hot reload |
| `lifecycle` | State machine (installing → started → removed) |
| `permissions` | Permission model + enforcement |
| `sandbox` | Isolation, timeouts, resource limits |
| `hooks` | onInstall, onLoad, onStart, onStop, onUpdate, onRemove |
| `events` | extension.installed, extension.loaded, permission.denied, etc. |
| `installer` | Install/remove from filesystem |
| `queries` | ListExtensions, FindExtension, ValidateExtension, CheckCompatibility |
| `kernel` | Kernel plugin registry port integration |
| `cli` | `lateen extensions` commands |

## SDK integration

Extensions scaffolded with `@lateen-os/sdk` include `sdkVersion` in manifest. The extension system validates SDK compatibility via semver against platform SDK `1.0.0`.

## Discovery paths

| Path | Pattern |
| ---- | ------- |
| `extensions/*` | Third-party extensions |
| `packages/*` | Package extensions |
| `apps/*` | Application extensions |
| `services/*` | Service extensions |
| `.lateen/marketplace/*` | Marketplace cache |

## Non-goals

- Business logic execution
- LLM inference
- Modifying platform source code
- Replacing Kubernetes
