# @lateen-os/sdk — Lateen SDK

Official developer interface for Lateen OS (Architecture v1.0 locked). This package serves two distinct purposes:

1. **The runtime composition root** — `createLateen()` wires `shared-kernel`, `ai-provider-hub`, `decision-engine`, `intelligence-engine`, `ai-runtime`, `ai-brain`, and `ceo-engine` into one working `LateenSystem`. This is the official public entry point into the running platform.
2. **`LateenSDK`** — a separate, pre-existing extension-authoring toolkit (`definePlugin`, `defineWorker`, `defineWorkflow`, `defineConnector`, a CLI) for building things that extend Lateen OS. It wraps platform contracts into a validated developer experience and contains no business logic. Unrelated to `createLateen()` — described further down.

## Install

```bash
pnpm add @lateen-os/sdk
```

## The runtime composition root

```typescript
import { createLateen } from '@lateen-os/sdk';

const system = createLateen();
// system: { providerHub, decisionEngine, intelligenceEngine, runtime, brain, ceo, client }

const mission = await system.ceo.submitMission({
  organizationId: 'org-1',
  title: 'Grow organic traffic',
  description: 'Improve SEO rankings for key product pages',
  priority: 'high',
});
await system.ceo.dispatchMission('org-1', mission.id);

const response = await system.brain.process({
  organizationId: 'org-1',
  sessionId: 'session-1',
  correlationId: 'corr-1',
  rawInput: 'Start a mission to expand into a new market',
  actorId: 'user-1',
});
```

**`LateenSystem`** (returned by `createLateen()`) is the full composition — every engine facade, for the process that owns the system:

| Facade | Wraps | Public surface |
| --- | --- | --- |
| `providerHub: ProviderHub` | `@lateen-os/ai-provider-hub`'s `createAiProviderHub` (used as-is — already a clean facade) | `capabilities: { chat, embedding, vision, speech, image, registry, modelRegistry, ..., queries: ProviderQueries }` |
| `decisionEngine: DecisionEngine` | `@lateen-os/decision-engine`'s real `createReasoner` + `createDecisionQueries` | `{ reasoner, queries: DecisionQueries }` |
| `intelligenceEngine: IntelligenceEngine` | `@lateen-os/intelligence-engine`'s real `createScorer`/`createRanker`/`createForecaster`/`createRecommender` + `createIntelligenceQueries` | `{ scorer, ranker, forecaster, recommender, queries: IntelligenceQueries }` |
| `runtime: Runtime` | `@lateen-os/ai-runtime`'s agent registry, task queue, conversation runtime, orchestrator + `createRuntimeQueries` (scoped — not an exhaustive re-export; scheduler/tool-execution/planning stay available via `@lateen-os/ai-runtime` directly) | `{ agentRegistry, taskQueue, conversations, orchestrator, queries: RuntimeQueries }` |
| `brain: Brain` | `@lateen-os/ai-brain`'s `createBrainSystem` | `{ process(request), capabilities, queries: BrainQueries }` |
| `ceo: CEO` | `@lateen-os/ceo-engine`'s `createCEOEngine` (used as-is) | `{ submitMission, dispatchMission, reportResult, getMission, listMissions }` |
| `client: LateenClient` | — | a narrower, read-oriented view: query interfaces for every engine, plus `getMission`/`listMissions` — no mission mutation, no reasoner/planner/orchestrator/conversation access. Safe to hand to a less-trusted consumer (e.g. a UI layer). |

**Dependency injection, no leaked internals:** every in-memory repository is constructed and wired inside its facade's factory function and never appears on the returned object — only real ports (`Reasoner`, `DecisionQueries`, `AgentRegistryService`, …) are exposed. `ai-provider-hub`/`decision-engine`/`intelligence-engine`/`ai-runtime` are themselves contracts-plus-real-implementations packages with dozens of internal modules; this package deliberately curates a small, stable public surface rather than re-exporting everything.

**Unconfigured providers degrade safely.** `createAiProviderHub` requires `chat`/`embedding`/`vision`/`speech`/`image`, but only `chat`/`embedding` have real OpenAI-compatible adapters in this monorepo (vision/speech/image are bring-your-own). `createLateen()` works with zero config — any capability you don't supply becomes a stub that throws `ProviderNotConfiguredError` only if actually invoked, so composition and testing never require a live provider.

```typescript
import { createLateen } from '@lateen-os/sdk';
import { createOpenAiCompatibleChatProvider } from '@lateen-os/ai-provider-hub';

const system = createLateen({
  providers: {
    chat: createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl: 'https://api.openai.com/v1', apiKey: process.env.OPENAI_API_KEY }),
  },
});
```

Why `ceo-engine` isn't wired the other way around (into `ai-brain`): `ceo-engine` used to declare an unused dependency on `sdk`; since `sdk` now depends on `ceo-engine`, that dependency was removed (it was never imported) to avoid a cycle — see [docs/adr/0003-no-cyclic-dependencies.md](../../docs/adr/0003-no-cyclic-dependencies.md). `ceo-engine` remains the intended caller of `system.brain.process()`, not the reverse.

## LateenSDK — extension-authoring toolkit

A separate concern from `createLateen()` above: a strongly typed, validated developer experience for building plugins, workers, workflows, connectors, and missions that extend Lateen OS. Contains no business logic.

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
| `system` | `createLateen`, `LateenSystem`, `LateenClient`, `CEO`, `Brain`, `Runtime`, `DecisionEngine`, `IntelligenceEngine`, `ProviderHub` — the runtime composition root |
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

**Runtime composition root (`system`):** `@lateen-os/shared-kernel`, `@lateen-os/ai-provider-hub`, `@lateen-os/decision-engine`, `@lateen-os/intelligence-engine`, `@lateen-os/ai-runtime`, `@lateen-os/ai-brain`, `@lateen-os/ceo-engine`.

**`LateenSDK` (extension authoring):** does not itself import `@lateen-os/shared-kernel`, `@lateen-os/business-dna`, `@lateen-os/workflow-engine`, or `@lateen-os/multi-agent` despite this package declaring them as dependencies (see `docs/certification/DEPENDENCY_AUDIT.md` F2 for the unused-dependency finding). `@lateen-os/ai-runtime` and `@lateen-os/ai-brain` are genuinely used, but only inside `system/` (the `createLateen()` composition root above), not inside `LateenSDK`'s own modules.

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
