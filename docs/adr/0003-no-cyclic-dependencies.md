# ADR 0003: No Cyclic Dependencies Between Packages

## Status

Accepted

## Context

Lateen OS is a pnpm + Turbo monorepo with a layered package structure (`shared-kernel` → `ai-provider-hub` / business-context packages → `decision-engine` → `intelligence-engine` → `ai-runtime`). Turbo's build graph, incremental caching, and parallel task execution all depend on the workspace dependency graph being a strict DAG. A cyclic dependency between packages breaks build ordering, defeats caching, and signals a layering violation — some piece of "lower-layer" logic actually depends on a "higher-layer" concept.

## Decision

Cyclic dependencies between workspace packages are prohibited without exception. Dependencies flow strictly downward through the layers. If a lower-layer package appears to need something from a higher layer, the shared concept is extracted downward (typically into `shared-kernel` or a dedicated shared package) rather than introducing a cycle.

## Consequences

- Turbo can always compute a correct, cacheable build order.
- Package boundaries stay meaningful — a package's dependency list is a reliable signal of its place in the architecture.
- Occasionally requires an extra extraction step (pulling a shared type or utility down a layer) instead of a quick cross-import; this is treated as the correct fix, not a workaround.
