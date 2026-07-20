# Administrator Guide — Lateen OS Enterprise v1.0.0-rc.1

## Overview

This guide covers platform administration for Lateen OS Enterprise Release Candidate v1.0.0-rc.1.

## Initial Setup

1. Deploy infrastructure (PostgreSQL, Redis, NATS, MinIO, Qdrant)
2. Run database migrations for Prisma services
3. Configure environment variables (see `security/environment-validation.md`)
4. Start backend services in dependency order (see `quality/dependency-validation.md`)
5. Start frontend applications
6. Complete Setup Wizard at port 3006

## Tenant Management

- Create tenants via Identity service or Setup Wizard
- Assign roles: admin, operator, developer, viewer
- Configure tenant-scoped Business DNA entities

## User Management

- Users managed through Identity service (:4003)
- RBAC enforced at API Gateway (:4008)
- SSO integration planned for v1.0 GA

## Monitoring

- Prometheus (:9090) — metrics collection
- Grafana (:3000) — dashboards
- OpenTelemetry Collector (:4318) — distributed tracing
- Structured logs via Pino on all services

## Backup & Recovery

See `deployment/docs/BACKUP-DR.md` and `quality/disaster-recovery-checklist.md`.

## Security

See `security/security-report.md` for full security review.

## Reference

- Platform manifest: `packages/kernel/src/registry/manifest.ts`
- Operations: `deployment/docs/OPERATIONS-GUIDE.md`
