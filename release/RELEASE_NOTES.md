# Lateen OS Enterprise v1.0.0-rc.2 — Release Notes

**Release Date:** 2026-07-30
**Architecture:** v1.0 (locked)
**Codename:** Enterprise RC

---

## What's New in rc.2

rc.2 adds the platform's first real REST API surface and its first consuming web application, on top of the rc.1 platform documented below (which is unchanged in this RC):

- **`apps/backend`** (port 4013) — a NestJS + Fastify REST API host exposing CRM, Sales, Finance, Inventory, Projects, HR, Customer Success, Documents, Analytics, Administration, and Marketplace endpoints over the platform's existing engine packages, with JWT auth/RBAC, Prisma/PostgreSQL persistence, and OpenAPI docs.
- **`apps/erp-web`** (port 3013) — a Next.js application consuming that API exclusively over HTTP.
- A follow-up production-hardening pass on both apps: security headers/rate limiting, fail-fast production config validation, real ESLint, Husky/lint-staged, test coverage reporting, a Docker Compose stack, extended CI, an operations guide, and measured (not estimated) performance benchmarks.

Full detail: `release/CHANGELOG.md` → `[1.0.0-rc.2]`. Remaining known issues are tracked in `release/KNOWN_LIMITATIONS.md`. A subsequent hardening pass closed six `apps/backend` security findings (including extending RBAC enforcement to Inventory and Projects, and adding regression-test coverage for all RBAC wiring), a Finance-engine precision issue, unguarded concurrency races, a deployment configuration drift (Postgres credentials and Node version), and both previously-reported Turbo cyclic dependencies — see `release/CHANGELOG.md` → `[Unreleased]`.

---

## rc.1 Overview

Lateen OS Enterprise v1.0.0-rc.1 is the first Release Candidate of the unified AI-native enterprise operating system. This release consolidates 34 epics of platform development into a production-ready candidate with full documentation, validation, and operational artifacts.

**This RC adds no new business features.** It focuses on production readiness, validation, hardening, and release preparation.

---

## What's Included

### Platform Core (19 packages)

Business DNA · Shared Kernel · Domain Graph · Institutional Memory · Decision Engine · Intelligence Engine · Capability Engine · AI Brain · AI Runtime · AI Workforce · Workflow Engine · Multi-Agent · AI Provider Hub · Kernel · SDK · Extension System · Connector Base · Integration Contracts · TypeScript Config

### Backend Services (12)

Business DNA (:4001) · Product Discovery (:4002) · Identity (:4003) · Integration Hub (:4004) · Mission Scheduler (:4005) · Marketplace (:4006) · Provisioning (:4007) · API Gateway (:4008) · Knowledge Platform (:4009) · Search Platform (:4010) · Analytics Platform (:4011) · Cloud Control Plane (:4012)

### Applications (13)

AI Product Manager (:3000) · Business DNA Studio (:3001) · CEO Cockpit (:3002) · Customer Portal (:3003) · Lateen Assistant (:3004) · Marketplace (:3005) · Setup Wizard (:3006) · Admin Gateway (:3007) · Search Center (:3008) · AI Studio (:3009) · Automation Studio (:3010) · Analytics Center (:3011) · Cloud Console (:3012)

### Extensions (19)

Google Workspace · Microsoft 365 · Gmail · Outlook · Google Drive · OneDrive · Dropbox · Slack · Teams · WhatsApp Business · Shopify · Stripe · WooCommerce · PayPal · Odoo · HubSpot · QuickBooks · ERPNext · Printing Industry Pack

### Infrastructure

PostgreSQL · Redis · NATS · MinIO · Qdrant · Prometheus · Grafana · OpenTelemetry Collector

---

## Upgrade Path

See [Migration Guide](../docs/release/MIGRATION_GUIDE.md) and [Upgrade Guide](../docs/release/UPGRADE_GUIDE.md).

---

## Verification

```bash
node release/scripts/validate.mjs
```

---

## Support

See [Troubleshooting Guide](../docs/release/TROUBLESHOOTING.md) and [Operations Guide](../deployment/docs/OPERATIONS-GUIDE.md). For `apps/backend`/`apps/erp-web` specifically, see [Backend + ERP Web Operations Guide](../docs/release/BACKEND_ERP_WEB_OPERATIONS.md).

---

## License

See [NOTICE](./NOTICE) and [LICENSE verification](./LICENSE-VERIFICATION.md).
