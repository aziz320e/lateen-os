# @lateen-os/customer-success-engine

Customer Success Engine — customer lifecycle, customer health, success plans, renewals, expansion, customer risks, and feedback for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Customer Success Engine is the canonical post-sale customer-success layer for Lateen OS: it owns the Customer Lifecycle (onboarding → activation → adoption → expansion/renewal → churn → reactivation — full guarded lifecycle), Customer Health (a deterministic score from usage, communication, projects, payment status, engagement, and renewals), Success Plans (objectives, milestones, owners, tasks), Renewals (pipeline, reminders, probability, status), Expansion (upsell/cross-sell opportunities), Customer Risks (a deterministic probability × impact risk register), and Feedback (NPS, CSAT, surveys, history) — and is the package that integrates CRM Engine, Sales Engine, Project Management Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory on behalf of the customer-success domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every calculation — health scoring, risk scoring, NPS/CSAT aggregation — is fixed arithmetic over caller-supplied numbers, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createCustomerSuccessRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Customer Lifecycle | `customer` | One record per real CRM Engine customer; guarded lifecycle: onboarding → activation → adoption → expansion/renewal → churn → reactivation, with `restartOnboarding()` for a full re-onboarding journey |
| Customer Health | `health` | Deterministic health score — an equally-weighted average of usage/communication/project/payment/engagement/renewal component scores, banded into a qualitative tier |
| Success Plans | `successplan` | Objectives, milestones, owners, and tasks toward a customer's goals |
| Renewals | `renewal` | Pipeline, reminders, probability, and guarded status lifecycle |
| Expansion | `expansion` | Upsell and cross-sell opportunities, optionally linked to a real Sales Engine opportunity |
| Customer Risks | `risk` | A risk register with deterministic probability × impact scoring and banding |
| Feedback | `feedback` | NPS, CSAT, and named surveys, with deterministic NPS/CSAT aggregation and full customer history |
| Relationship Layer | `relationship-management` | Integrates CRM Engine, Sales Engine, Project Management Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory — see below |
| Query Layer | `queries` | Real, read-only `CustomerSuccessQueries` port — `findCustomers` / `findHealth` / `findRenewals` / `findPlans` / `findFeedback` / `findRisks` / `findExpansion` / `searchCustomerSuccess` |
| Event Bus | `events` | Typed `CustomerSuccessEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, Sales Engine, Project Management Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 7 required packages has a real, genuine integration point in `relationship-management`:

- **CRM Engine** — `getCustomerContext()` fetches a real CRM Engine customer via `customers.get()`. Optional — injected as `Pick<CrmRuntime, 'customers'>`.
- **Sales Engine** — `getOpportunityContext()` fetches a real Sales Engine opportunity via `opportunities.get()`. Optional — injected as `Pick<SalesRuntime, 'opportunities'>`.
- **Project Management Engine** — `getCustomerProjectsContext()` reads real Project Management Engine projects via `queries.findProjects()` and filters them client-side by `customerId` — never touching a repository. Optional — injected as `Pick<ProjectRuntime, 'queries'>`.
- **Communication Hub** — `notifyCustomerSuccessEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordCustomerSuccessMetric()` records a real gauge metric snapshot via `metrics.recordGauge()`. Optional — injected as `Pick<AnalyticsRuntime, 'metrics'>`.
- **Business DNA** — `getBusinessProfileContext()` fetches the real Business DNA business profile via `businessProfile.get()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — `logCustomerSuccessDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`/`[]`) when not injected, so the Customer Success Engine is fully usable — and fully tested — completely offline.

## Event bus

`CustomerSuccessEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`customer.onboarded`, `customer.activated`, `customer.health.updated`, `renewal.created`, `renewal.completed`, `customer.churned`, `customer.reactivated`, `feedback.received`, `successplan.completed`, `risk.detected`.

## Usage

```typescript
import { createCustomerSuccessRuntime } from '@lateen-os/customer-success-engine';

const cse = createCustomerSuccessRuntime();

const record = await cse.customers.onboard('org-1', { customerId: 'customer-1' });
await cse.customers.activate('org-1', record.id);

const snapshot = await cse.health.recordSnapshot('org-1', {
  customerId: 'customer-1',
  usageScore: 80, communicationScore: 75, projectScore: 90, paymentScore: 100, engagementScore: 70, renewalScore: 85,
});

const plan = await cse.plans.createPlan('org-1', { customerId: 'customer-1', name: 'Q1 Growth Plan' });
await cse.plans.addObjective('org-1', { planId: plan.id, title: 'Reach adoption milestone' });

const renewal = await cse.renewals.createRenewal('org-1', { customerId: 'customer-1', renewalDate: '2026-06-01' });
await cse.renewals.sendReminder('org-1', renewal.id, { channel: 'email' });

const risk = await cse.risks.create('org-1', { customerId: 'customer-1', title: 'Champion departed', probability: 3, impact: 4 });
await cse.feedback.recordFeedback('org-1', { customerId: 'customer-1', feedbackType: 'nps', score: 9 });
```

Wiring in the real CRM Engine / Sales Engine / Project Management Engine / Communication Hub / Analytics Engine / Business DNA / Institutional Memory collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createProjectRuntime } from '@lateen-os/project-management-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const cse = createCustomerSuccessRuntime({
  crm: createCrmRuntime(),
  sales: createSalesRuntime(),
  projects: createProjectRuntime(),
  communicationHub: createCommunicationRuntime(),
  analytics: createAnalyticsRuntime(),
  businessDna: createBusinessDnaRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
cse.events.subscribe('risk.detected', (payload) => {
  console.log(`Risk ${payload.riskId} on customer ${payload.customerId} scored ${payload.score}`);
});
```

## Structure

```
src/
├── shared/                     # IDs, decimal/date arithmetic, primitives
├── customer/                   # Customer Lifecycle
├── health/                     # Customer Health — deterministic scoring
├── successplan/                # Success Plans — objectives, milestones, tasks
├── renewal/                    # Renewals — pipeline, reminders, probability
├── expansion/                  # Expansion — upsell/cross-sell
├── risk/                       # Customer Risks
├── feedback/                   # Feedback — NPS, CSAT, surveys
├── relationship-management/    # CRM / Sales / Projects / Communication Hub / Analytics / Business DNA / Institutional Memory integration
├── queries/                    # Real CustomerSuccessQueries read layer
├── events/                     # Typed CustomerSuccessEventMap
├── runtime.ts                  # createCustomerSuccessRuntime() composition root
└── index.ts
```

See [CUSTOMER_SUCCESS_MODEL.md](./CUSTOMER_SUCCESS_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId`; optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Relationship Layer collaborator
- `@lateen-os/sales-engine` — optional Relationship Layer collaborator
- `@lateen-os/project-management-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/customer-success-engine build
pnpm --filter @lateen-os/customer-success-engine typecheck
pnpm --filter @lateen-os/customer-success-engine test
pnpm --filter @lateen-os/customer-success-engine lint
```
