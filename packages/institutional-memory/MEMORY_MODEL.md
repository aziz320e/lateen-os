# Institutional Memory Model

> Canonical memory model for Lateen OS v1.0

## What Institutional Memory is

Institutional Memory is the organization's **curated long-term knowledge** — decisions, lessons, research, playbooks, and documented experience that persists beyond individual employees or chat sessions.

| Is | Is not |
| -- | ------ |
| Decisions with rationale | Chat history |
| Lessons learned | Application logs |
| Research findings | Raw telemetry |
| Playbooks and procedures | Vector embeddings (this package) |
| Meeting outcomes | AI inference logic |

## Aggregate overview

### InstitutionalMemory (root)

The umbrella artifact for classified, scored, and visibility-scoped memory.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `id` | `InstitutionalMemoryId` | Stable identifier |
| `organizationId` | `OrganizationId` | Tenant |
| `title` | `string` | Short title |
| `summary` | `string` | Discovery summary |
| `source` | `MemorySourceLabel` | Provenance (not chat) |
| `category` | `MemoryCategory` | Classification |
| `importance` | `ImportanceLevel` | Retrieval priority |
| `confidence` | `ConfidenceScore` | Trust score (0–100) |
| `visibility` | `Visibility` | Access scope |
| `tags` | `MemoryTag[]` | Discovery tags |
| `createdAt` / `updatedAt` | `Timestamp` | Audit |

### KnowledgeEntry

Typed knowledge with 10 knowledge types:

`best_practice`, `lesson_learned`, `policy`, `procedure`, `decision`, `observation`, `research`, `insight`, `finding`, `template`

Specialized aggregates (DecisionRecord, LessonLearned, etc.) provide **structured depth**; KnowledgeEntry provides **taxonomy and search**.

### DecisionRecord

| Field | Description |
| ----- | ----------- |
| `decision` | What was decided |
| `reason` | Why |
| `alternatives` | Options considered |
| `outcome` | Result after implementation |
| `ownerId` | Responsible employee |
| `reviewDate` | Scheduled review |

### LessonLearned

| Field | Description |
| ----- | ----------- |
| `situation` | Context |
| `problem` | What went wrong or was challenging |
| `rootCause` | Underlying cause |
| `resolution` | What was done |
| `recommendation` | Future guidance |

### MeetingRecord

| Field | Description |
| ----- | ----------- |
| `attendees` | Employee IDs |
| `topics` | Discussion topics |
| `notes` | Meeting notes |
| `actionItems` | Follow-up tasks |
| `decisionIds` | Linked decisions |

### IncidentRecord

| Field | Description |
| ----- | ----------- |
| `severity` | critical → informational |
| `impact` | Business/operational impact |
| `cause` | Root cause |
| `resolution` | How it was resolved |
| `prevention` | Preventive measures |

### Playbook

| Field | Description |
| ----- | ----------- |
| `purpose` | Why this playbook exists |
| `steps` | Ordered procedure steps |
| `expectedOutcome` | Success criteria |
| `kpiIds` | Linked Business DNA KPIs |

### ResearchRecord

| Field | Description |
| ----- | ----------- |
| `topic` | Research subject |
| `source` | Provenance |
| `summary` | Findings summary |
| `confidence` | Confidence score |
| `recommendations` | Actionable recommendations |

### Template

| Field | Description |
| ----- | ----------- |
| `category` | Memory category |
| `content` | Template body |
| `variables` | Placeholder definitions |

### DocumentReference

| Field | Description |
| ----- | ----------- |
| `documentType` | policy, report, contract, … |
| `source` | Document provenance |
| `ownerId` | Custodian employee |
| `relatedEntities` | Links to domain graph entities |

### Timeline

| Type | Description |
| ---- | ----------- |
| `TimelineEvent` | Single chronological event |
| `MemoryTimeline` | Ordered collection of events for an entity or organization |

## Classification

| Type | Values |
| ---- | ------ |
| `MemoryCategory` | operational, strategic, technical, commercial, compliance, safety, quality, people, customer, supplier, process, general |
| `ImportanceLevel` | critical, high, medium, low, archival |
| `Visibility` | organization, department, team, private, restricted |
| `RetentionPolicy` | retain/archive/purge days, legal hold |

## Confidence

| Type | Description |
| ---- | ----------- |
| `ConfidenceScore` | Decimal string 0–100 |
| `Evidence` | Supporting evidence record |
| `EvidenceSource` | direct_observation, meeting_minutes, incident_report, research_study, … |

## Entity linking

Memory artifacts link to Business DNA entities via `DocumentReference.relatedEntities` and `MemoryQueries.findByEntity()` using `GraphNodeType` + `entityId` from `@lateen-os/domain-graph`.

## Query port

`MemoryQueries` provides:

- `findMemories`, `findLessons`, `findResearch`, `findDecisions`
- `findIncidents`, `findKnowledge`, `findPlaybooks`, `findTemplates`
- `findByEntity`, `findByTags`, `findByTimeRange`

## Lifecycle pattern

Most aggregates follow: `draft` → `active`/`published` → `archived`

Domain events are emitted on each lifecycle transition (types only — no dispatch in this package).
