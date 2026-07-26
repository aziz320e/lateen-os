# @lateen-os/integration-tests

The first end-to-end integration suite for Lateen OS. Verifies that the real engines — CEO, Brain, Runtime, Decision Engine, Intelligence Engine, Provider Hub — work together when composed the one supported way: `createLateen()` from `@lateen-os/sdk`.

This package implements no new business logic and changes no architecture. It only exercises what the engines already do, through their real, already-implemented public APIs.

## Principles

- **Real composition only.** Every scenario calls `createLateen()` and drives the returned `LateenSystem` — no mocks, no fakes, no stubbed engines. The only hand-built objects are Decision Engine fixtures (`tests/fixtures.ts`), needed because `DecisionEngine`'s facade intentionally exposes no repository write path (see Commit 9).
- **Offline and deterministic.** No network calls, no timers, no randomness in assertions. Decision Engine's reasoner is a pure function of its input (recommendation strength − risk penalty), so scenario expectations are exact numbers, not ranges.
- **Dependency injection only.** Nothing reaches into a package's internals; every object under test is what `createLateen()` actually returns.
- **CEO and Brain are siblings, not a pipeline.** In the current architecture neither calls the other — `LateenSystem` composes them side by side. Scenarios that involve both call each one directly in sequence; they don't assume one triggers the other, because it doesn't.

## Scenarios

| File | Verifies |
| --- | --- |
| `scenario-1-full-success.test.ts` | The full happy path: CEO submits/dispatches a mission, Brain generates a plan (genuinely routing through the same Runtime agent registry the mission's agent was registered against), Decision Engine reasons a proposal to a pass, Intelligence Engine scores the opportunity, the mission completes. |
| `scenario-2-mission-requires-approval.test.ts` | Brain's permission validation warns (not rejects) when no actor is attached; Decision Engine deterministically fails to clear a weak recommendation against high risk. |
| `scenario-3-unknown-intent.test.ts` | Brain classifies unrecognizable input as `"unknown"`, fails reasoning, but still degrades to a usable generalist-worker plan. CEO's independent, keyword-based planner has no `"unknown"` concept and always falls back to its own default agent — both real behaviors are verified side by side rather than assumed to agree. |
| `scenario-4-validation-failure.test.ts` | Decision Engine rejects a weak recommendation against critical risk (score clamped to `0.00`); a CEO mission failed on that basis cannot be re-completed or re-failed — the mission state machine rejects any further transition once terminal. |
| `scenario-5-multiple-sequential-missions.test.ts` | Three sequential missions with mixed outcomes accumulate correctly in one long-lived `LateenSystem`; missions stay isolated per organization. |

## Run

```bash
pnpm --filter @lateen-os/integration-tests build
pnpm --filter @lateen-os/integration-tests typecheck
pnpm --filter @lateen-os/integration-tests test
```
