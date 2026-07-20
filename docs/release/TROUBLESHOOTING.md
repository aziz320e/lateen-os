# Troubleshooting Guide — Lateen OS Enterprise v1.0.0-rc.1

## Build Issues

### Turbo cyclic dependency

```
Error: cyclic dependency detected: @lateen-os/kernel ↔ @lateen-os/sdk ↔ @lateen-os/extension-system
```

**Workaround:** Use phased validation:
```bash
node release/scripts/validate.mjs
```

### Per-package build failure

```bash
pnpm --filter @lateen-os/<package> build 2>&1
```

## Runtime Issues

### Service won't start

1. Check environment variables (`security/environment-validation.md`)
2. Verify infrastructure is running (`health-check.sh`)
3. Check service logs for Prisma/Redis connection errors

### 401 Unauthorized

- Verify JWT token is valid and not expired
- Check Identity service is running (:4003)
- Confirm tenant ID in request headers

### 503 Service Unavailable

- Check API Gateway (:4008) health
- Verify downstream service is running
- Review dependency graph (`quality/dependency-validation.md`)

## Database Issues

See `deployment/docs/runbooks/DATABASE-ISSUES.md`.

## Performance Issues

See `benchmarks/performance-report.md` for baseline metrics.

## Getting Help

- Operations runbooks: `deployment/docs/runbooks/`
- Architecture docs: `docs/architecture/`
- Release notes: `release/RELEASE_NOTES.md`
