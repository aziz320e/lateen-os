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

## Scope

| Included | Excluded |
| -------- | -------- |
| 11 aggregate type definitions | Persistence |
| Classification & confidence models | Vector database |
| Domain events | Embeddings |
| Repository ports | AI implementation |
| Query ports | UI / API / HTTP |
| Timeline model | ORM / business logic |

## Usage

```typescript
import {
  memory,
  lesson,
  queries,
  type InstitutionalMemory,
  type MemoryQueries,
  type LessonLearned,
} from '@lateen-os/institutional-memory';

declare const memoryQueries: MemoryQueries;
await memoryQueries.findLessons({ organizationId: orgId });
await memoryQueries.findByEntity(orgId, 'project', projectId);
await memoryQueries.findByTimeRange(orgId, { start, end });
```

## Aggregates

| Module | Aggregate | Purpose |
| ------ | --------- | ------- |
| `memory` | `InstitutionalMemory` | Root curated memory artifact |
| `knowledge` | `KnowledgeEntry` | Typed knowledge (best practice, insight, …) |
| `decision` | `DecisionRecord` | Decision, reason, alternatives, outcome |
| `lesson` | `LessonLearned` | Situation → root cause → recommendation |
| `meeting` | `MeetingRecord` | Attendees, topics, notes, actions, decisions |
| `incident` | `IncidentRecord` | Severity, impact, cause, prevention |
| `playbook` | `Playbook` | Purpose, steps, expected outcome, KPIs |
| `research` | `ResearchRecord` | Topic, source, summary, recommendations |
| `template` | `Template` | Reusable content with variables |
| `document` | `DocumentReference` | External document linked to entities |
| `timeline` | `MemoryTimeline` | Chronological memory events |

## Structure

```
src/
├── shared/
├── classification/    # MemoryCategory, ImportanceLevel, Visibility, RetentionPolicy
├── confidence/        # ConfidenceScore, Evidence, EvidenceSource
├── memory/
├── knowledge/
├── decision/
├── lesson/
├── meeting/
├── incident/
├── playbook/
├── research/
├── template/
├── document/
├── timeline/
├── queries/
└── index.ts
```

See [MEMORY_MODEL.md](./MEMORY_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/domain-graph`

## Build

```bash
pnpm --filter @lateen-os/institutional-memory build
pnpm --filter @lateen-os/institutional-memory typecheck
```
