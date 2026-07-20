# Lateen OS Enterprise — Changelog

All notable changes for **Lateen OS Enterprise v1.0.0-rc.1**.

## [1.0.0-rc.1] — 2026-07-20

### Release Candidate

First Release Candidate for Lateen OS Enterprise v1.0. No new business features in this release — production hardening and validation only.

### Platform (Epics 1–34)

- **Epic 27** Enterprise API Gateway — `services/api-gateway`, `apps/admin-gateway`
- **Epic 28** AI Provider Hub — `packages/ai-provider-hub`
- **Epic 29** Enterprise Knowledge Platform — `services/knowledge-platform`
- **Epic 30** Enterprise Search — `services/search-platform`, `apps/search-center`
- **Epic 31** AI Studio — `apps/ai-studio`
- **Epic 32** Automation Studio — `apps/automation-studio`
- **Epic 33** Enterprise Analytics — `services/analytics-platform`, `apps/analytics-center`
- **Epic 34** Lateen Cloud Platform — `services/cloud-control-plane`, `apps/cloud-console`

### RC Additions (Epic 35)

- Release artifacts under `release/`
- Quality validation under `quality/`
- Security review under `security/`
- Performance benchmarks under `benchmarks/`
- Release documentation under `docs/release/`
- Phased validation script `release/scripts/validate.mjs`

### Known Issues

- Turbo cyclic dependency: `@lateen-os/kernel` ↔ `@lateen-os/sdk` ↔ `@lateen-os/extension-system` — use phased validation script
- Payment gateway: stub only (Cloud Control Plane)
- AI execution: contract/stub in design-time apps (AI Studio, Automation Studio)

### Architecture

- Architecture v1.0 locked — see `release/FREEZE.md`

[1.0.0-rc.1]: https://github.com/lateen-os/lateen-os/releases/tag/v1.0.0-rc.1
