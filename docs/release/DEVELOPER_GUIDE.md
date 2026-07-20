# Developer Guide — Lateen OS Enterprise v1.0.0-rc.1

## Getting Started

```bash
git clone <repo>
cd lateen-os
pnpm install
node release/scripts/validate.mjs
```

## Monorepo Structure

| Directory | Purpose |
| --------- | ------- |
| `packages/` | Domain packages, kernel, SDK |
| `services/` | Backend NestJS services |
| `apps/` | Next.js frontend applications |
| `extensions/` | Platform extensions |
| `deployment/` | Docker, Helm, Terraform |
| `release/` | Release artifacts |

## Development Workflow

1. Create feature branch from `main`
2. Make changes in relevant package/service/app
3. Run per-package validation:
   ```bash
   pnpm --filter @lateen-os/<package> build
   pnpm --filter @lateen-os/<package> typecheck
   pnpm --filter @lateen-os/<package> test
   ```
4. Submit PR with architecture review if touching frozen surfaces

## Architecture Constraints (v1.0)

- No business logic in domain packages (contracts only)
- BFF pattern for all frontend apps
- NestJS + Fastify for all backend services
- Zod validation on all API inputs

## Frozen Surfaces

See `release/FREEZE.md` — no changes to API, SDK, or extension manifest schema during RC.

## Reference

- Architecture: `docs/architecture/lateen-os-v1.md`
- SDK Guide: [SDK_GUIDE.md](./SDK_GUIDE.md)
- Extension Guide: [EXTENSION_GUIDE.md](./EXTENSION_GUIDE.md)
