# Upgrade Guide — Lateen OS Enterprise v1.0.0-rc.1

## RC → GA Upgrade Path

When v1.0.0 GA is released:

1. Review GA release notes for breaking changes (none expected from RC)
2. Run database migrations (forward-only)
3. Update container images to GA tags
4. Run full validation suite
5. Execute DR drill (deferred from RC)

## Version Pinning

| Component | RC Version | GA Target |
| --------- | ---------- | --------- |
| Platform | 1.0.0-rc.1 | 1.0.0 |
| SDK | 1.0.0 | 1.0.0 |
| Extension Schema | v1 | v1 |
| Architecture | v1.0 | v1.0 |

## Upgrade Steps

```bash
git pull origin main
pnpm install
node release/scripts/validate.mjs
# Deploy updated images
helm upgrade lateen-os deployment/helm/lateen-os/
```

## Known RC Issues (resolved in GA)

1. Turbo cyclic dependency — root `pnpm build` workaround
2. A05 security hardening — CSP, rate limiting tuning
3. Automated backup/DR drills
4. Load testing baseline

See `release/ROADMAP.md` for post-RC plans.

## Compatibility

See `quality/compatibility-matrix.md` for full compatibility validation.
