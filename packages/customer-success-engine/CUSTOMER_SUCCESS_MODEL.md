# Customer Success Model

> Real, implemented model for the Customer Success Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Customer Lifecycle

`customer/engine.impl.ts`'s `createCustomerLifecycleEngine()` implements one record per real CRM Engine customer, guarded by a fully-connected lifecycle:

- **`onboard()`** — starts a record at `status: 'onboarding'`, `currentVersion: 1`. Throws `DuplicateCustomerSuccessRecordError` if a record already exists for that customer in the organization — at most one record per (organization, customer) pair. Publishes `customer.onboarded`.
- **`activate()`** — `onboarding → activation`. Publishes `customer.activated`.
- **`progressToAdoption()` / `expand()` / `renew()`** — the cyclic core of the lifecycle: `activation → adoption`, `adoption ⇄ renewal`, `adoption/renewal → expansion → renewal`. Real customer accounts move back and forth between these three states for years, so the transition table is deliberately not a one-way funnel.
- **`churn()`** — reachable from every non-terminal status. Publishes `customer.churned`.
- **`reactivate()`** — `churn → reactivation`. Publishes `customer.reactivated`.
- **`restartOnboarding()`** — `reactivation → onboarding`, a distinct operation (not an automatic side effect of `reactivate()`) for a full re-onboarding journey — the transition table declares this edge, and a dedicated method is required to reach it, exactly like the Deliverables module's `resubmit()` in the Project Management Engine.

---

## Customer Health

`health/engine.impl.ts`'s `createCustomerHealthEngine()` implements deterministic health snapshots. **No prediction anywhere.**

- **`computeHealthScore()`** (pure) — an equally-weighted average of six caller-supplied 0–100 component scores (usage, communication, projects, payment, engagement, renewals), rounded to the nearest whole point.
- **`computeHealthTier()`** (pure) — fixed banding: `healthy` (≥75), `neutral` (≥50), `at_risk` (≥25), `critical` (<25).
- **`recordSnapshot()`** — computes and persists an immutable snapshot, publishing `customer.health.updated` with the overall score and tier.
- **`getLatest()`** — the most recently recorded snapshot for a customer; ties on `createdAt` (possible within the same millisecond) resolve deterministically to the most recently inserted snapshot, not an arbitrary one.

---

## Success Plans

`successplan/engine.impl.ts`'s `createSuccessPlanEngine()` implements four linked sub-aggregates — mirroring the Project Management Engine's Project/Phase/Milestone/Task separation:

- **`SuccessPlan`** — `active → completed | cancelled`. `completePlan()` publishes `successplan.completed`.
- **`PlanObjective`** — `pending → achieved`, via `addObjective()` / `achieveObjective()`.
- **`PlanMilestone`** — `pending → reached | missed`, via `addMilestone()` / `reachMilestone()` / `missMilestone()`, mirroring the Project Management Engine's Milestone.
- **`PlanTask`** — `pending → in_progress → completed`, via `addTask()` / `startTask()` / `completeTask()`.

Every sub-aggregate requires its parent plan to exist (`SuccessPlanNotFoundError` otherwise) but is otherwise independently queryable via `findObjectivesForPlan()` / `findMilestonesForPlan()` / `findTasksForPlan()`.

---

## Renewals

`renewal/engine.impl.ts`'s `createRenewalEngine()` implements pipeline, reminders, probability, and status for contract/subscription renewals:

- **`createRenewal()`** — starts at `status: 'pipeline'` with a default 50% probability (overridable). Publishes `renewal.created`.
- **`sendReminder()`** — appends an immutable `RenewalReminder` (`sentAt`, optional `channel`) every time it's called; only advances `pipeline → reminder_sent` on the *first* call — subsequent reminders from `reminder_sent` or `at_risk` keep the current status while still recording the reminder.
- **`markAtRisk()`** — reachable from `pipeline` or `reminder_sent`.
- **`updateProbability()`** — changes the probability without affecting status, at any time before completion.
- **`complete()`** — `won` or `lost`, both terminal. Publishes `renewal.completed` with the outcome.

---

## Expansion

`expansion/engine.impl.ts`'s `createExpansionEngine()` implements upsell and cross-sell opportunity tracking. **Never duplicates Sales Engine.**

- **`identify()`** — starts at `status: 'identified'`, with `opportunityType: 'upsell' | 'cross_sell'`.
- **`propose()` → `win()` / `lose()`** — `identified → proposed → won | lost`; `lose()` is also reachable directly from `identified` (a deal can die before ever being proposed).
- **`linkSalesOpportunity()`** — records an opaque `linkedSalesOpportunityId` foreign key at any point in the lifecycle. The real Sales Engine opportunity is resolved only through the Relationship Layer's `getOpportunityContext()` — this module never re-implements Sales Engine's own pipeline.

---

## Customer Risks

`risk/engine.impl.ts`'s `createCustomerRiskEngine()` implements a risk register with deterministic scoring — the same pattern as the Project Management Engine's Project Risks module:

- **`computeCustomerRiskScore()`** (pure) — `probability × impact`, each a 1–5 ordinal rating (max score 25).
- **`computeCustomerRiskLevel()`** (pure) — fixed banding: `low` (≤5), `medium` (≤12), `high` (≤20), `critical` (>20).
- **`create()`** — starts at `status: 'identified'`, computing the score immediately. Publishes `risk.detected` with the score.
- **`startMitigation()` → `resolve()`**, **`accept()`**, **`markOccurred()`** — the guarded lifecycle: `identified → mitigating → resolved`, `identified → accepted`, and `occurred` reachable from `identified`, `mitigating`, or `accepted`.
- **`update()`** — recomputes `score` whenever `probability`/`impact` change, and records `mitigation` notes.

---

## Feedback

`feedback/engine.impl.ts`'s `createFeedbackEngine()` implements NPS, CSAT, and named surveys with deterministic aggregation. **Never infers sentiment from free text** — every score is a caller-supplied number.

- **`computeNpsCategory()`** (pure) — fixed categorization: 9–10 promoter, 7–8 passive, 0–6 detractor.
- **`computeNpsScore()`** (pure) — the standard `%promoters − %detractors` formula over `nps`-typed entries with a defined score, rounded to the nearest whole point; `0` for an empty list.
- **`computeAverageCsat()`** (pure) — a plain mean of `csat`-typed scores, rounded to 2 decimal places; `0` for an empty list.
- **`recordFeedback()`** — appends exactly one immutable `FeedbackEntry` — there is no update or delete on this engine's public surface. Publishes `feedback.received`.
- **`getHistory()`** — chronological feedback for one customer, oldest first.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 7 required packages, each exclusively through its public API:

- **`getCustomerContext()`** — real CRM Engine `customers.get()`.
- **`getOpportunityContext()`** — real Sales Engine `opportunities.get()`.
- **`getCustomerProjectsContext()`** — reads real Project Management Engine `queries.findProjects()` and filters the result client-side by `customerId` — the Project Management Engine's own query surface has no `customerId` filter, so this is the only correct way to reach it without touching a repository or modifying that package.
- **`notifyCustomerSuccessEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`recordCustomerSuccessMetric()`** — real Analytics Engine `metrics.recordGauge()`.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`logCustomerSuccessDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'customer'`-category knowledge entry.

Every method degrades to a documented `null`/`[]` when its collaborator was not injected, so the Customer Success Engine remains fully usable — and fully tested — completely offline.
