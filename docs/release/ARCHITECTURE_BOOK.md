# Architecture Book — Lateen OS Enterprise v1.0

**Version:** 1.0.0-rc.1  
**Status:** Architecture v1.0 (locked)

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Architecture Layers](#architecture-layers)
3. [Domain Packages](#domain-packages)
4. [Services](#services)
5. [Applications](#applications)
6. [Extensions](#extensions)
7. [Infrastructure](#infrastructure)
8. [Cross-Cutting Concerns](#cross-cutting-concerns)

## Platform Overview

Lateen OS is an AI-native enterprise operating system built as a monorepo with contract-first domain packages, NestJS backend services, and Next.js frontend applications.

**Canonical reference:** `docs/architecture/lateen-os-v1.md`

## Architecture Layers

```
┌─────────────────────────────────────────┐
│  Applications (13 Next.js apps)         │
├─────────────────────────────────────────┤
│  API Gateway + BFF Layer                │
├─────────────────────────────────────────┤
│  Backend Services (12 NestJS services)  │
├─────────────────────────────────────────┤
│  Domain Packages (19 contract packages) │
├─────────────────────────────────────────┤
│  Kernel + SDK + Extension System        │
├─────────────────────────────────────────┤
│  Infrastructure (8 components)          │
└─────────────────────────────────────────┘
```

## Domain Packages

| Package | Purpose |
| ------- | ------- |
| business-dna | Core business entities |
| shared-kernel | Shared types and utilities |
| domain-graph | Entity relationship graph |
| institutional-memory | Knowledge persistence |
| decision-engine | Decision contracts |
| intelligence-engine | Intelligence contracts |
| capability-engine | Capability contracts |
| ai-brain | AI reasoning contracts |
| ai-runtime | AI execution contracts |
| ai-workforce | Worker contracts |
| workflow-engine | Workflow contracts |
| multi-agent | Multi-agent collaboration |
| ai-provider-hub | AI provider abstraction |

## Services

12 backend services on ports 4001–4012. See `packages/kernel/src/registry/manifest.ts`.

## Applications

13 frontend applications on ports 3000–3012. BFF pattern with TanStack Query.

## Extensions

19 extensions covering productivity, commerce, finance, and industry verticals.

## Infrastructure

PostgreSQL · Redis · NATS · MinIO · Qdrant · Prometheus · Grafana · OTEL Collector

## Cross-Cutting Concerns

- **Observability:** OpenTelemetry + Pino + Prometheus
- **Security:** Identity service + API Gateway RBAC
- **Multi-tenancy:** Tenant-scoped repositories
- **Job processing:** BullMQ + Redis

## Epic Reports

Full architecture reports for all 34 epics in `docs/architecture/`.

## Decisions

See `release/ARCHITECTURE_DECISION_SUMMARY.md`.
