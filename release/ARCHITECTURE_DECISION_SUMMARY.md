# Architecture Decision Summary — v1.0.0-rc.1

## ADR-001: Monorepo with Turborepo

**Decision:** pnpm workspace + Turborepo for build orchestration.  
**Status:** Accepted. Known cyclic dependency in kernel/sdk/extension-system documented for RC.

## ADR-002: NestJS + Fastify for Services

**Decision:** All backend services use NestJS with Fastify adapter.  
**Status:** Accepted across 12 services.

## ADR-003: Next.js 15 for Applications

**Decision:** All frontend apps use Next.js 15 + React 19 + TanStack Query.  
**Status:** Accepted across 13 applications.

## ADR-004: Contract-First Domain Packages

**Decision:** Domain packages (Business DNA, AI Runtime, etc.) are contracts-only in v1.0 — no business logic in platform epics.  
**Status:** Accepted and verified across Epics 27–34.

## ADR-005: BFF Pattern for Apps

**Decision:** Applications use Next.js API routes as BFF; no direct client-to-service calls.  
**Status:** Accepted.

## ADR-006: OpenTelemetry Everywhere

**Decision:** All services instrumented with OTEL; collector optional via env.  
**Status:** Accepted.

## ADR-007: Prisma for Stateful Services

**Decision:** PostgreSQL + Prisma for services requiring persistence.  
**Status:** Accepted (Business DNA, Identity, Marketplace, etc.).

## ADR-008: Architecture v1.0 Lock

**Decision:** No architectural changes during RC. Freeze all contract surfaces.  
**Status:** Accepted — `release/FREEZE.md`.
