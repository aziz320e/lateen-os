# Document Model

> Real, implemented model for the Document Management Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Document Lifecycle

`document/engine.impl.ts`'s `createDocumentLifecycleEngine()` implements the required 10 document types and a guarded lifecycle:

- **`create()`** — starts a document at `status: 'draft'`, `currentVersionNumber: 0` (no content version yet), `currentVersion: 1`. Publishes `document.created`.
- **`submitForReview()` / `returnToDraft()` / `approve()` / `publish()`** — the guarded ordinary lifecycle: `draft → review → approved → published`, with `review → draft` as an explicit rejection path. `submitForReview()` publishes `document.reviewed`; `approve()` publishes `document.approved`; `publish()` publishes `document.published`.
- **`archive()` / `restore()`** — the same deliberate asymmetry used across the monorepo (Finance Engine's Chart of Accounts, HR Engine's Employee/Department, Inventory Engine's Inventory Catalog, Project Management Engine's Project): `archived` has no outgoing edges in `DOCUMENT_TRANSITIONS`, so the ordinary lifecycle methods can never resurrect an archived document. `restore()` is a distinct operation that returns it to its `statusBeforeArchive`, publishing `document.restored`.
- **`delete()`** — a genuine, permanent removal (`repository.delete()`, unlike every other method here which only mutates a status field). Guarded to require `status === 'archived'` first — a document must be archived before it can be deleted. Publishes `document.deleted`.
- **`update()`** — rejected on an archived document (`InvalidDocumentTransitionError`) — `restore()` first. Publishes `document.updated`.
- The 10 document types (`contract`, `proposal`, `invoice_reference`, `sop`, `policy`, `specification`, `report`, `project_document`, `customer_document`, `hr_document`) are a plain enum on the `Document` aggregate — this package never branches its lifecycle logic on type, only its query/search layer filters by it.

---

## Folders

`folder/engine.impl.ts`'s `createFolderManagementEngine()` implements hierarchical containers with permissions and ownership:

- **`create()` / `update()` / `archive()` / `restore()`** — a simple, fully symmetric 2-state (`active`/`archived`) lifecycle, guarded by `canTransitionFolder()` — unlike Document's archive/restore asymmetry, both directions are ordinary guarded transitions here, matching the simpler container semantics of Department/Portfolio elsewhere in the monorepo.
- **`grantPermission()` / `revokePermission()`** — a `FolderPermission` list keyed by `principalId`; granting again for the same principal replaces their existing access level rather than appending a duplicate entry.
- **`getChildren()` / `getDescendants()` / `getAncestors()`** — direct children, every descendant at any depth (breadth-first traversal), and the ancestor chain from the immediate parent up to the root — the same hierarchy-traversal pattern as HR Engine's Department module.

---

## Version Control

`version/engine.impl.ts`'s `createVersionControlEngine()` implements immutable content snapshots, composed intra-package with the Document Lifecycle engine. **Content is never stored or interpreted** — every version carries only an opaque `contentRef`.

- **`createVersion()`** — computes the next `versionNumber` as `max(existing versionNumbers for this document) + 1`, persists an immutable `DocumentVersion`, and calls the injected Document Lifecycle engine's `setCurrentVersionNumber()` to advance the document's pointer — the same intra-package composition pattern as Inventory Engine's movement/stock relationship. Publishes `document.version.created`. Throws `DocumentNotFoundError` if the document doesn't exist.
- **`compareVersions()`** — a fixed equality check (`contentRefA !== contentRefB`) between any two versions of the same document, never a content diff. Throws `DocumentVersionNotFoundError` if either version is missing.
- **`restoreVersion()`** — moves the document's `currentVersionNumber` pointer to any existing version, forward or backward, without ever deleting a later version — versions are strictly append-only; only the pointer moves.

---

## Metadata

`metadata/engine.impl.ts`'s `createMetadataEngine()` implements tags, categories, owners, retention, and deterministic expiry detection, one record per document.

- **`isExpired()`** (pure) — `asOfDate >= expiryDate`; `false` when no expiry date is set.
- **`upsertMetadata()` / `addTag()` / `removeTag()` / `addCategory()` / `removeCategory()`** — auto-create the document's metadata record on first use (`getOrCreate()`), so callers never need a separate "initialize metadata" step. `addTag()`/`addCategory()` are idempotent for an already-present value.
- **`checkExpiry()`** — evaluates `isExpired()` against the stored `expiryDate` and, only on the **first** transition from `expired: false` to `expired: true`, persists the flag and publishes `document.expired` — subsequent calls after that never re-publish.

---

## Relationships

`relationship/engine.impl.ts`'s `createRelationshipEngine()` implements directed links from a document to any of 7 related entity types (`document`, `project`, `customer`, `employee`, `knowledge`, `workflow`, `communication`). **Every target is an opaque `string` id — this module never fetches or duplicates the target entity.**

- **`linkEntity()`** — records a `DocumentRelationship` with an optional free-text `relationType` label (e.g. `'amends'`, `'author'`, `'approver'`). The same document may link to the same related entity more than once, distinguished by `relationType`.
- **`unlinkEntity()`** — a real `repository.delete()`; throws `DocumentRelationshipNotFoundError` for an unknown or cross-organization relationship.
- **`findByDocument()` / `findByRelatedEntity()`** — the two natural query directions: everything a document links to, and everything that links to a given entity.

**Naming note**: this module (`relationship`) is intentionally distinct from `relationship-management` (the Relationship Layer, below) — one is this package's own data model, the other is real integration with sibling package runtimes. The composition root exposes them as `runtime.relationships` and `runtime.relationshipManagement` respectively, never conflated.

---

## Search

The Query Layer's `searchDocuments()` (in `queries/document-management-queries.impl.ts`) implements deterministic search across **title, metadata (tags/categories/owners), owner, and category** — exactly the fields named in the specification:

- For every document, the match score is the **maximum** of: title match, owner-id match, and every tag/category/owner match found in that document's linked `DocumentMetadata` record.
- For every folder, the match score is a plain name match.
- Scoring is the shared, monorepo-wide convention: exact match (case-insensitive) = 3, substring match = 2, no match = 0. Ties break by id ascending.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 8 required packages, each exclusively through its public API:

- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`logDocumentDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'compliance'`-category knowledge entry (documents are frequently policies, contracts, and SOPs — compliance artifacts by nature).
- **`notifyDocumentEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`getProjectContext()`** — real Project Management Engine `projects.get()` — read-only, this package never mutates a project.
- **`getCustomerContext()`** — real CRM Engine `customers.get()`.
- **`getCustomerSuccessContext()`** — real Customer Success Engine `customers.findByCustomer()`.
- **`raiseDocumentApprovalWorkflow()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`recordDocumentMetric()`** — real Analytics Engine `metrics.recordGauge()`.

Every method degrades to a documented `null` when its collaborator was not injected, so the Document Management Engine remains fully usable — and fully tested — completely offline.
