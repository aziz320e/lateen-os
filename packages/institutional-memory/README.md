# @lateen-os/institutional-memory

Institutional Memory Engine — long-term organizational knowledge for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

Institutional Memory represents **everything the organization learns over time**:

- Decisions and their rationale
- Lessons from incidents and projects
- Research findings and insights
- Playbooks and procedures
- Meeting outcomes and action items

It is **not** chat history. It is **not** logs. It is curated, long-term institutional knowledge consumed by Proactive AI and human operators.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` engine where the module has real behavior
- Framework agnostic — no UI, REST, database, vector store, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no embeddings, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createInstitutionalMemoryRuntime()` for the composition root

## Real runtime vs. contracts-only

The `knowledge` module (`KnowledgeEntry` — the aggregate this commit's "Memory Lifecycle" operates on) is a **real, deterministic, in-memory implementation**:

| Capability | Notes |
| ---------- | ----- |
| Memory / Knowledge Lifecycle | Guarded `create` / `update` / `archive` / `restore` / `requestReview` / `rollback`, backed by a real in-memory `KnowledgeEntryRepository` |
| Memory Versioning | Every content-changing `update()` (and every `rollback()`) appends an immutable `KnowledgeEntryVersion` snapshot with author tracking — never mutated or deleted |
| Memory Search | Deterministic keyword search over title/content + tag/category/source/type/status filtering, ranked by a computed relevance score — no embeddings, no vector database |
| Knowledge Relationships | Related links (symmetric), parent/child hierarchy, and directed reference edges forming a dependency graph — every write is cycle-guarded |
| Knowledge Validation | Duplicate detection (exact title + Jaccard content similarity), stale-knowledge detection, ownership validation, expiration checks |
| Retention Engine | Archive rules (`retentionPolicy.archiveAfterDays`), expiration rules (`expiresAt`), review scheduling (`reviewDueAt`), and a pure read-only `recommendCleanup()` dry run alongside a mutating `applyRetentionRules()` |
| Query Layer | Real, read-only `KnowledgeRuntimeQueries` port — `findKnowledge` / `findPolicies` / `findPlaybooks` / `findLessonsLearned` / `findTemplates` / `findRelatedKnowledge` / `findExpiringKnowledge` / `searchKnowledge` |
| Event Bus | Typed `InstitutionalMemoryEventMap`; every declared event is genuinely published by the service that triggers it |

The other 10 aggregates (`memory`, `decision`, `lesson`, `meeting`, `incident`, `playbook`, `research`, `template`, `document`, `timeline`) plus `classification`/`confidence` remain **contracts only** — types and repository ports with no runtime behavior yet. `KnowledgeType` now also covers `sop`, `playbook`, `faq`, and `documentation` alongside the original 10 types, so a single real `KnowledgeEntry` aggregate can represent every entry kind this commit requires (policies, SOPs, playbooks, decisions, lessons learned, FAQs, documentation, and reusable templates).

## Event bus

`InstitutionalMemoryEventMap` declares the 8 required events, each genuinely published by the real service that causes it:

`knowledge.created`, `knowledge.updated`, `knowledge.archived`, `knowledge.restored`, `knowledge.version.created`, `knowledge.review.required`, `knowledge.expired`, `knowledge.relationship.created`.

## Usage

```typescript
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const runtime = createInstitutionalMemoryRuntime();

const entry = await runtime.lifecycle.create('org-1', {
  title: 'Refund SOP',
  content: 'Step 1: verify order. Step 2: issue refund within 48 hours.',
  knowledgeType: 'sop',
  category: 'process',
  source: 'ops-handbook',
  tags: ['refunds', 'customer-service'],
  reviewDueAt: '2026-01-01T00:00:00.000Z',
});

await runtime.lifecycle.update('org-1', entry.id, {
  content: 'Step 1: verify order. Step 2: issue refund within 24 hours.',
  authorId: 'employee-1',
  changeSummary: 'Tightened refund SLA',
});

const history = await runtime.lifecycle.getVersionHistory('org-1', entry.id);
console.log(history.length); // 2 immutable revisions

const { matches } = await runtime.queries.searchKnowledge({ organizationId: 'org-1', keyword: 'refund' });
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('knowledge.version.created', (payload) => {
  console.log(`Entry ${payload.knowledgeEntryId} is now at revision ${payload.revisionNumber}`);
});
```

## Aggregates

| Module | Aggregate | Purpose | Real? |
| ------ | --------- | ------- | ----- |
| `knowledge` | `KnowledgeEntry` | Typed knowledge (policy/SOP/playbook/decision/lesson/FAQ/documentation/template) | ✅ Lifecycle, versioning, search, relationships, validation, retention |
| `memory` | `InstitutionalMemory` | Root curated memory artifact | contracts only |
| `decision` | `DecisionRecord` | Decision, reason, alternatives, outcome | contracts only |
| `lesson` | `LessonLearned` | Situation → root cause → recommendation | contracts only |
| `meeting` | `MeetingRecord` | Attendees, topics, notes, actions, decisions | contracts only |
| `incident` | `IncidentRecord` | Severity, impact, cause, prevention | contracts only |
| `playbook` | `Playbook` | Purpose, steps, expected outcome, KPIs | contracts only |
| `research` | `ResearchRecord` | Topic, source, summary, recommendations | contracts only |
| `template` | `Template` | Reusable content with variables | contracts only |
| `document` | `DocumentReference` | External document linked to entities | contracts only |
| `timeline` | `MemoryTimeline` | Chronological memory events | contracts only |

## Structure

```
src/
├── shared/
├── classification/    # MemoryCategory, ImportanceLevel, Visibility, RetentionPolicy
├── confidence/        # ConfidenceScore, Evidence, EvidenceSource
├── memory/             (contracts only)
├── knowledge/          # real: lifecycle, search, relationships, validation, retention
├── decision/            (contracts only)
├── lesson/              (contracts only)
├── meeting/             (contracts only)
├── incident/            (contracts only)
├── playbook/            (contracts only)
├── research/            (contracts only)
├── template/            (contracts only)
├── document/            (contracts only)
├── timeline/            (contracts only)
├── queries/            # real KnowledgeRuntimeQueries + original MemoryQueries contract
├── events/             # typed InstitutionalMemoryEventMap
├── runtime.ts          # createInstitutionalMemoryRuntime() composition root
└── index.ts
```

See [MEMORY_MODEL.md](./MEMORY_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/domain-graph`

## Verification

```bash
pnpm --filter @lateen-os/institutional-memory build
pnpm --filter @lateen-os/institutional-memory typecheck
pnpm --filter @lateen-os/institutional-memory test
pnpm --filter @lateen-os/institutional-memory lint
```
