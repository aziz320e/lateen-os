# lateen-os

Lateen OS

## Architecture

Lateen OS is a **domain-driven monorepo** organized in seven layers. Business capabilities live under `domains/`; implementation lives in `apps/`, `packages/`, and `services/`.

See [docs/architecture/lateen-os-v1.md](./docs/architecture/lateen-os-v1.md) — **Lateen OS Architecture v1.0 Locked**.

```
Layer 1  Business DNA        domains/business-dna/
Layer 2  Core Platform       domains/core/
Layer 3  Intelligence        domains/intelligence/
Layer 4  AI Workforce        domains/ai-workforce/
Layer 5  Business Domains    domains/{marketing,sales,…}/
Layer 6  Applications        apps/
Layer 7  Infrastructure       infrastructure/ · docker/ · .github/
```

Each domain defines _what_ the system is responsible for. Code in `apps/`, `packages/`, and `services/` implements domain capabilities and should map clearly to the domain it serves.

See [domains/](./domains/) for the full domain catalog.

### Domains

| Domain                                  | Layer | Responsibility                                                |
| --------------------------------------- | ----- | ------------------------------------------------------------- |
| [business-dna](./domains/business-dna/) | 1     | Canonical business model — single source of truth for the org |
| [core](./domains/core/)                 | 2     | Platform capabilities: identity, security, messaging, search  |
| [intelligence](./domains/intelligence/) | 3     | Analysis, discovery, forecasting, and recommendations         |
| [ai-workforce](./domains/ai-workforce/) | 4     | AI agents operating as digital workers across the org         |
| [marketing](./domains/marketing/)       | 5     | Brand, positioning, and market communication                  |
| [sales](./domains/sales/)               | 5     | Revenue acquisition and commercial relationships              |
| [operations](./domains/operations/)     | 5     | Day-to-day execution and process delivery                     |
| [finance](./domains/finance/)           | 5     | Financial planning, accounting, and reporting                 |
| [products](./domains/products/)         | 5     | Product catalog, lifecycle, and offerings                     |
| [machines](./domains/machines/)         | 5     | Automation, integrations, and system orchestration            |
| [projects](./domains/projects/)         | 5     | Initiative planning, delivery, and tracking                   |
| [customers](./domains/customers/)       | 5     | Customer relationships and lifecycle management               |
| [memory](./domains/memory/)             | 5     | Institutional Memory — organizational history and context     |

**Business DNA** is the canonical business model. All AI agents consume Business DNA; they never maintain a parallel business model.

**Intelligence** analyzes data and produces insights. **AI Workforce** agents act on those insights within defined roles and permissions — operating in both **Reactive Mode** (on request) and **Proactive Mode** (continuous monitoring and unsolicited recommendations, opportunities, risks, and optimization proposals).

## Monorepo

This repository is a [pnpm](https://pnpm.io/) + [Turborepo](https://turbo.build/) monorepo.

### Structure

```
lateen-os/
├── domains/         # Domain-driven bounded contexts (responsibility definitions)
├── apps/            # Frontend and client applications
├── packages/        # Shared libraries and tooling
├── services/        # Backend API and worker services
├── infrastructure/  # IaC and deployment configuration
├── docs/            # Documentation and ADRs
├── scripts/         # Development and maintenance scripts
├── docker/          # Local Docker Compose and container configs
└── .github/         # GitHub Actions workflows
```

### Prerequisites

- Node.js 20+
- pnpm 9+

### Getting started

```bash
pnpm install
pnpm dev
```

### Common commands

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Start all apps in development mode |
| `pnpm build`     | Build all packages and apps        |
| `pnpm lint`      | Lint all packages and apps         |
| `pnpm test`      | Run tests across the monorepo      |
| `pnpm typecheck` | Type-check all TypeScript projects |
| `pnpm format`    | Format code with Prettier          |
| `pnpm clean`     | Clean build artifacts              |

### Adding a workspace package

1. Identify the domain and architecture layer it belongs to under `domains/`.
2. Create a directory under `apps/`, `packages/`, or `services/`.
3. Add a `package.json` with the standard Turborepo scripts (`build`, `dev`, `lint`, `test`, `typecheck`, `clean`).
4. Extend `@lateen-os/typescript-config` in your `tsconfig.json`:

```json
{
  "extends": "@lateen-os/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

5. Run `pnpm install` from the repository root.

### Local infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
./infrastructure/scripts/platform-health.ps1
```

Platform integration (Epic 5): [docs/architecture/platform-integration-report-v1.md](./docs/architecture/platform-integration-report-v1.md)
