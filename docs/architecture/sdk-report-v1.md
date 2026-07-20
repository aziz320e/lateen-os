# Lateen SDK — Report v1.0

**Date:** 2026-07-19  
**Architecture:** v1.0 (locked)  
**Epic:** 21 — Lateen SDK  
**Package:** `@lateen-os/sdk` v1.0.0

## Executive Summary

The Lateen SDK provides the official, strongly typed developer interface for extending Lateen OS. It wraps existing platform contracts (workflow-engine, multi-agent, ai-workforce, kernel, ai-brain) into validated define/create helpers, event utilities, CLI scaffolding, and test mocks. No business logic is included.

## Deliverables

| Area | Status | Location |
| ---- | ------ | -------- |
| Core SDK (`LateenSDK`, context, config, version) | ✅ | `packages/sdk/src/core/` |
| Applications API | ✅ | `packages/sdk/src/application/` |
| Services API | ✅ | `packages/sdk/src/service/` |
| Plugins API | ✅ | `packages/sdk/src/plugin/` |
| Workers API | ✅ | `packages/sdk/src/worker/` |
| Workflows API | ✅ | `packages/sdk/src/workflow/` |
| Missions API | ✅ | `packages/sdk/src/mission/` |
| Connectors API | ✅ | `packages/sdk/src/connector/` |
| Commands API | ✅ | `packages/sdk/src/commands/` |
| Events (publish/subscribe) | ✅ | `packages/sdk/src/events/` |
| Configuration + feature flags | ✅ | `packages/sdk/src/configuration/` |
| Validation helpers | ✅ | `packages/sdk/src/validation/` |
| Testing mocks + utilities | ✅ | `packages/sdk/src/testing/` |
| Templates (7 kinds) | ✅ | `packages/sdk/src/templates/` |
| CLI (`lateen-sdk`) | ✅ | `packages/sdk/src/cli/` |
| Documentation | ✅ | `packages/sdk/*.md` |
| Build (tsup) | ✅ | `packages/sdk/tsup.config.ts` |
| Tests (vitest) | ✅ | `packages/sdk/tests/` |

## Technology Stack

| Tool | Purpose |
| ---- | ------- |
| TypeScript | Language |
| Zod | Schema validation |
| Commander | CLI |
| tsup | ESM bundle + declarations |
| Vitest | Unit tests |

## CLI Commands

| Command | Description |
| ------- | ----------- |
| `lateen-sdk init` | Initialize extension project |
| `lateen-sdk create plugin <name>` | Scaffold plugin |
| `lateen-sdk create worker <name>` | Scaffold worker |
| `lateen-sdk create connector <name>` | Scaffold connector |
| `lateen-sdk create workflow <name>` | Scaffold workflow |
| `lateen-sdk create mission <name>` | Scaffold mission |
| `lateen-sdk create application <name>` | Scaffold application |
| `lateen-sdk create service <name>` | Scaffold service |
| `lateen-sdk doctor` | Validate SDK environment |

## Platform Integration Map

| SDK Module | Platform Dependency |
| ---------- | ------------------- |
| `workflow` | `@lateen-os/workflow-engine` WorkflowDefinition |
| `mission` | `@lateen-os/multi-agent` Mission |
| `worker` | `@lateen-os/ai-workforce` AIWorker lifecycle |
| `plugin` | `@lateen-os/kernel` PluginRegistry kinds |
| `events` | `{entity}.{action}` convention (ai-brain, shared-kernel) |
| `connector` | Integration Hub patterns |
| `service` | Kernel service registry |

## API Surface Summary

### Core exports

- `createLateenSDK()`, `LateenSDK`, `SDKContext`, `SDKConfiguration`, `SDKVersion`

### Define helpers (standalone)

- `defineApplication`, `defineService`, `definePlugin`, `defineWorker`
- `defineWorkflow`, `defineMission`, `defineConnector`, `defineCommand`, `defineConfig`

### Events

- `SdkEventBus`, `defineEvent`, `publish`, `subscribe`

### Validation

- `validateManifest`, `validatePermissions`, `validateSchema`, `safeValidateSchema`

### Testing

- `createMockService`, `createMockWorker`, `createMockWorkflow`, `createMockConnector`
- `createTestSdk`, `createTestEventBus`, `collectEvents`

## Verification

```bash
pnpm --filter @lateen-os/sdk build      # tsup
pnpm --filter @lateen-os/sdk typecheck  # tsc --noEmit
pnpm --filter @lateen-os/sdk test       # vitest
```

## Known Limitations

1. **Scaffolding only** — CLI generates starter files; does not register with kernel automatically.
2. **In-process events** — Event bus is local; NATS integration is an implementation concern for extensions.
3. **No runtime execution** — SDK validates and describes; platform services execute.
4. **Extension directory** — Scaffolds to `extensions/<name>/` (convention, not yet in pnpm workspace glob).

## Recommendations

1. Add `extensions/*` to `pnpm-workspace.yaml` when extension ecosystem launches.
2. Wire `lateen-sdk create` to auto-register plugins with kernel registry.
3. Publish `@lateen-os/sdk` to npm/ghcr when external developers onboard.

---

*Generated as part of Epic 21 — Lateen SDK. Architecture v1.0 remains locked.*
