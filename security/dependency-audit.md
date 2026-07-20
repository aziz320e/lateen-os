# Dependency Audit — v1.0.0-rc.1

**Date:** 2026-07-20  
**Scope:** Full monorepo (`pnpm audit`)

## Summary

| Severity | Count | Action |
| -------- | ----- | ------ |
| Critical | 0 | — |
| High | 0 | — |
| Moderate | Review | Document in GA |
| Low | Review | Accept for RC |

## Audit Command

```bash
pnpm audit
pnpm audit --prod
```

## Key Dependencies

| Package | Version | Purpose |
| ------- | ------- | ------- |
| @nestjs/common | ^11.0.7 | Backend framework |
| fastify | ^5.2.1 | HTTP server |
| next | ^15.1.6 | Frontend framework |
| @prisma/client | ^6.3.1 | ORM |
| bullmq | ^5.34.8 | Job queues |
| zod | ^3.24.1 | Validation |

## Recommendations (post-RC)

1. Enable Dependabot/Renovate for automated updates
2. Pin production dependencies in lockfile (already via pnpm-lock.yaml)
3. Run `pnpm audit --prod` in CI on every release branch

## RC Status

✅ No blocking vulnerabilities identified for RC release.
