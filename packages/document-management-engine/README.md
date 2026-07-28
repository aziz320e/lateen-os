# @lateen-os/document-management-engine

Document Management Engine — document lifecycle, folders, document types, version control, metadata, relationships, and search for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Document Management Engine is the canonical document-of-record layer for Lateen OS: it owns the Document Lifecycle (draft → review → approved → published → archived, with a distinct restore and a guarded hard delete), Folders (hierarchy, permissions, ownership), the 10 required Document Types, Version Control (immutable content snapshots, deterministic comparison, pointer restore), Metadata (tags, categories, owners, retention, expiry), Relationships (directed links from a document to other documents, projects, customers, employees, knowledge, workflows, and communications), and deterministic Search — and is the package that integrates Business DNA, Institutional Memory, Communication Hub, Project Management Engine, CRM Engine, Customer Success Engine, Workflow Engine, and Analytics Engine on behalf of the document domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (content itself is never stored or interpreted — every version is an opaque `contentRef`, every comparison is a fixed equality check, every search match is fixed substring/exact-match scoring)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createDocumentManagementRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Document Lifecycle | `document` | Guarded draft → review → approved → published → archived lifecycle, a distinct `restore()`, and a guarded hard `delete()` (archived documents only). Covers all 10 required document types |
| Folders | `folder` | Hierarchy (parent/child, ancestors, descendants), per-principal permissions (read/write/admin), ownership, simple active/archived lifecycle |
| Version Control | `version` | Immutable content snapshots (`DocumentVersion`), deterministic `compareVersions()`, and a pointer-only `restoreVersion()` that never deletes later versions |
| Metadata | `metadata` | Tags, categories, multiple owners, retention, and expiry, with deterministic expiry detection |
| Relationships | `relationship` | Directed links from a document to another document, project, customer, employee, knowledge entry, workflow, or communication — every target addressed by an opaque id, never duplicated |
| Relationship Layer | `relationship-management` | Integrates Business DNA, Institutional Memory, Communication Hub, Project Management Engine, CRM Engine, Customer Success Engine, Workflow Engine, and Analytics Engine — see below |
| Query Layer | `queries` | Real, read-only `DocumentManagementQueries` port — `findDocuments` / `findFolders` / `findVersions` / `findMetadata` / `findRelationships` / `searchDocuments` |
| Event Bus | `events` | Typed `DocumentManagementEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with Business DNA, Institutional Memory, Communication Hub, Project Management Engine, CRM Engine, Customer Success Engine, Workflow Engine, and Analytics Engine

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 8 required packages has a real, genuine integration point in `relationship-management`:

- **Business DNA** — `getBusinessProfileContext()` fetches the real Business DNA business profile via `businessProfile.get()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — `logDocumentDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Communication Hub** — `notifyDocumentEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Project Management Engine** — `getProjectContext()` fetches a real project via `projects.get()`. Optional — injected as `Pick<ProjectRuntime, 'projects'>`.
- **CRM Engine** — `getCustomerContext()` fetches a real customer via `customers.get()`. Optional — injected as `Pick<CrmRuntime, 'customers'>`.
- **Customer Success Engine** — `getCustomerSuccessContext()` fetches a real customer-success record via `customers.findByCustomer()`. Optional — injected as `Pick<CustomerSuccessRuntime, 'customers'>`.
- **Workflow Engine** — `raiseDocumentApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine document-approval workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Analytics Engine** — `recordDocumentMetric()` records a real gauge metric snapshot via `metrics.recordGauge()`. Optional — injected as `Pick<AnalyticsRuntime, 'metrics'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the Document Management Engine is fully usable — and fully tested — completely offline.

**Note on naming**: the runtime exposes two distinctly-named surfaces that are easy to conflate — `runtime.relationships` is this package's own intra-document linking engine (documents ↔ projects/customers/employees/etc., all opaque ids), while `runtime.relationshipManagement` is the Relationship Layer described above (real calls into sibling package runtimes).

## Event bus

`DocumentManagementEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`document.created`, `document.updated`, `document.reviewed`, `document.approved`, `document.published`, `document.archived`, `document.restored`, `document.version.created`, `document.expired`, `document.deleted`.

## Usage

```typescript
import { createDocumentManagementRuntime } from '@lateen-os/document-management-engine';

const dme = createDocumentManagementRuntime();

const folder = await dme.folders.create('org-1', { name: 'Contracts' });
const document = await dme.documents.create('org-1', { title: 'Master Services Agreement', documentType: 'contract', folderId: folder.id });

await dme.versions.createVersion('org-1', { documentId: document.id, contentRef: 'blob-1', changeNotes: 'Initial draft' });
await dme.documents.submitForReview('org-1', document.id);
await dme.documents.approve('org-1', document.id);
await dme.documents.publish('org-1', document.id);

await dme.metadata.upsertMetadata('org-1', { documentId: document.id, tags: ['urgent'], categories: ['legal'], expiryDate: '2027-01-01' });
await dme.relationships.linkEntity('org-1', { documentId: document.id, relatedEntityType: 'project', relatedEntityId: 'project-1' });
```

Wiring in the real Business DNA / Institutional Memory / Communication Hub / Project Management Engine / CRM Engine / Customer Success Engine / Workflow Engine / Analytics Engine collaborators:

```typescript
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createProjectRuntime } from '@lateen-os/project-management-engine';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createCustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';

const dme = createDocumentManagementRuntime({
  businessDna: createBusinessDnaRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
  communicationHub: createCommunicationRuntime(),
  projects: createProjectRuntime(),
  crm: createCrmRuntime(),
  customerSuccess: createCustomerSuccessRuntime(),
  workflow: createWorkflowRuntime(),
  analytics: createAnalyticsRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
dme.events.subscribe('document.expired', (payload) => {
  console.log(`Document ${payload.documentId} has expired`);
});
```

## Structure

```
src/
├── shared/                     # IDs, date arithmetic, primitives
├── document/                   # Document Lifecycle — draft/review/approved/published/archived
├── folder/                     # Folders — hierarchy, permissions, ownership
├── version/                    # Version Control — immutable snapshots, compare, restore
├── metadata/                   # Metadata — tags, categories, owners, retention, expiry
├── relationship/                # Relationships — links to documents/projects/customers/employees/knowledge/workflows/communications
├── relationship-management/    # Business DNA / Institutional Memory / Communication Hub / Project Management Engine / CRM Engine / Customer Success Engine / Workflow Engine / Analytics Engine integration
├── queries/                    # Real DocumentManagementQueries read layer
├── events/                     # Typed DocumentManagementEventMap
├── runtime.ts                  # createDocumentManagementRuntime() composition root
└── index.ts
```

See [DOCUMENT_MODEL.md](./DOCUMENT_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId`; optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/project-management-engine` — optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Relationship Layer collaborator
- `@lateen-os/customer-success-engine` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/document-management-engine build
pnpm --filter @lateen-os/document-management-engine typecheck
pnpm --filter @lateen-os/document-management-engine test
pnpm --filter @lateen-os/document-management-engine lint
```
