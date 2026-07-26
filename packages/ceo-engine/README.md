# @lateen-os/ceo-engine

CEO Engine — the orchestration layer that delegates missions to Lateen OS's specialized executive agents.

## Purpose

CEO Engine owns the mission lifecycle and routes each mission to the right executive agent (`seo`, `marketing`, `sales`, `product`, `operations`, `finance`). It coordinates planning, assignment, and execution status, and reports outcomes back onto the mission — it does not implement the agents themselves.

## Modules

| Module | Responsibility |
| --- | --- |
| `types.ts` | `Mission`, `AgentTask`, `AgentResult`, and the `AgentId` union of executive roles |
| `mission.ts` | Mission lifecycle: `pending -> running -> completed \| failed`, backed by an in-memory, organization-scoped repository (`@lateen-os/shared-kernel`) |
| `planner.ts` | Deterministic, offline planning — matches a mission's title/description against each agent's keyword vocabulary and produces ordered `AgentTask`s, falling back to `operations` when nothing matches |
| `dispatcher.ts` | Plans and assigns a pending mission's lead agent, starts it, and applies `AgentResult`s back onto the mission lifecycle |
| `ceo.ts` | Composition root — `createCEOEngine()` wires the above into a single facade |

## Usage

```typescript
import { createCEOEngine } from '@lateen-os/ceo-engine';

const ceo = createCEOEngine();

const mission = await ceo.submitMission({
  organizationId: 'org-1',
  title: 'Grow organic traffic',
  description: 'Improve SEO rankings for key product pages',
  priority: 'high',
});

const tasks = await ceo.dispatchMission('org-1', mission.id);
// tasks: readonly AgentTask[] routed to the matching agent(s)

const completed = await ceo.reportResult('org-1', {
  missionId: mission.id,
  success: true,
  message: 'rankings improved',
});
```

## Scope

| Included | Excluded |
| --- | --- |
| Mission lifecycle & state machine | Executive agent implementations |
| Deterministic mission-to-agent planning | LLM / AI reasoning |
| Task dispatch & result reporting | Persistence beyond in-memory |
| Composition root (`createCEOEngine`) | UI / API / HTTP |

## Status

Core orchestration is implemented and unit-tested (`tests/`). Not yet wired to a real executive-agent runtime — `AgentResult`s are currently reported by callers, not produced by live agents.
