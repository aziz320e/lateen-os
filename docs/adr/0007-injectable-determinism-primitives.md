# ADR 0007: Injectable Determinism Primitives (`now()`, Randomness)

## Status

Accepted

## Context

Business logic that reads the wall clock (`Date.now()`, `new Date()`) or generates randomness (`Math.random()`, uninjected `crypto.randomBytes()`) directly is inherently harder to test deterministically and can introduce subtle non-determinism into an otherwise auditable decision pipeline — a core concern for a platform whose founding principle is that decisions must be explainable and auditable (`docs/handbook/00_MASTER_PLAN.md` §1). At the same time, real production code needs real timestamps and real cryptographic randomness (for IDs, tokens, encryption keys) — the goal is testability without sacrificing genuine randomness/entropy in production.

## Decision

Every `create*` factory that has a notion of "now" accepts an injectable `now: () => string` parameter, defaulting to a real ISO-timestamp function when not supplied. Every function that needs cryptographic randomness (ID generation, token generation, encryption-key generation, initialization vectors) accepts an injectable randomness source, defaulting to real `node:crypto` primitives (`randomBytes`, `randomUUID`) when not supplied — verified directly in `packages/ai-security-engine/src/shared/crypto.ts`'s `RandomBytesFn` parameter pattern, mirrored across every package that generates security-sensitive values. Business logic itself never introduces hidden non-determinism beyond real, intentional ID generation — no package was found using `Math.random()` for anything (`docs/certification/SECURITY_AUDIT.md`).

## Consequences

- Tests can supply a fixed clock and a fixed (or recorded) randomness source to get fully deterministic, repeatable output — without weakening production behavior, which always defaults to real time and real cryptographic randomness.
- This is the same injectable-primitive pattern applied twice — once for time, once for randomness — rather than two unrelated conventions, making it predictable across the whole codebase (`docs/AI_PROJECT_CONTEXT.md` §4, rule 6).
- A package that reads `Date.now()` or calls an uninjected randomness source directly inside its business logic (rather than as a default-parameter fallback) would violate this ADR — no such case was found in the audit underlying `docs/certification/ARCHITECTURE_AUDIT.md` and `PERFORMANCE_AUDIT.md`, but this remains a concrete, checkable rule for any future package.
