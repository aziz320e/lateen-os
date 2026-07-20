# Marketplace Architecture

Architecture v1.0 — distribution platform only.

## Principles

1. **No business logic** — catalog, distribution, and installation contracts only
2. **Reuse Extension System** — never duplicate `extension.json` manifests
3. **Kernel integration** — `lateen marketplace` CLI commands
4. **Hexagonal structure** — domain ports, application services, API adapters

## Components

```
services/marketplace/
├── domain/           # Contracts (Publisher, Extension, Release, etc.)
├── application/      # Distribution services
├── repositories/     # In-memory (dev/test) + Prisma (production)
├── api/              # NestJS controllers
└── infrastructure/   # Redis cache, OpenTelemetry

apps/marketplace/
├── app/              # Next.js 15 pages + BFF routes
├── lib/api/          # Client + server fetch
└── components/       # Browse, search, extension detail UI
```

## Integration

| System | Integration |
| ------ | ----------- |
| Extension System | Validates manifests via `parseExtensionManifest` |
| Kernel | Platform manifest entry + `lateen marketplace` CLI |
| SDK | Compatible with `engineVersion` / `sdkVersion` checks |
| Redis | Search result caching (optional) |
| PostgreSQL | Prisma persistence for catalog |

## Extension Categories

Application, Service, Connector, Workflow, Mission, AI Worker, Industry Pack, Dashboard, Widget, Theme

## Release Channels

Stable, Beta, Alpha, Nightly

## Distribution Modes

Public, Private, Enterprise

## Future

- OpenSearch integration for full-text search
- Package artifact storage (MinIO)
- Enterprise license enforcement
