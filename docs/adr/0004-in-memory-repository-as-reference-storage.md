# ADR 0004: In-Memory Repository as the Reference Storage Layer

## Status

Accepted

## Context

Every business package under `packages/*` needs a storage layer for its aggregates, but the platform's stated goal (per `docs/handbook/00_MASTER_PLAN.md` §3.2, "Fully offline-testable") is that all business logic must be testable without a live database, network access, or any external service. Hand-rolling a bespoke in-memory `Map`-backed implementation once per aggregate, per package, would duplicate the same tenant-scoping and CRUD logic dozens of times across the monorepo (verified: every package's `repository.impl.ts` follows an identical shape).

## Decision

`@lateen-os/shared-kernel/repository`'s `createInMemoryRepository<TEntity, TId>()` is the single, generic, reusable in-memory repository implementation every package builds its own `repository.impl.ts` on top of. It is a `Map<TId, TEntity>`-backed store providing `findById(organizationId, id)`, `save(entity)`, `delete(organizationId, id)`, `list(organizationId?)`, and `clear()`. Every lookup is tenant-scoped by construction: `findById`/`delete` return nothing if the stored entity's `organizationId` doesn't match the caller's. Point lookups (`findById`/`save`/`delete`) are O(1); listing/filtering is O(n) in the entity count for that organization — deliberately simple, since there is no real persistence layer to index against.

This is a reference/offline storage strategy, not a production persistence layer: no package under `packages/*` uses an ORM, a real database driver, or any real network-backed storage. If a package is ever backed by a real persistent store in a future milestone, this ADR's tenant-scoping contract (`organizationId` required on every read/write) should be preserved, and appropriate indexing should be added at that time — see `docs/certification/PERFORMANCE_AUDIT.md`.

## Consequences

- Every package's test suite runs fully offline, with zero mocking libraries — the real repository implementation is exercised directly in every test.
- Point lookups are O(1); full-organization scans are O(n) — acceptable for an in-memory reference implementation, verified to have no accidental quadratic behavior (`docs/certification/PERFORMANCE_AUDIT.md`).
- Multi-tenancy (organization isolation) is enforced structurally at the repository layer itself, not left to each package's business logic to re-implement — a cross-tenant read is impossible by construction, not just by convention.
- This pattern does not, by itself, provide durability, transactions, or real query indexing — those are explicitly out of scope until (and unless) a package is backed by a real persistent store.
