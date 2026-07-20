# Domains

Lateen OS is organized as a **domain-driven monorepo**. Each folder under `domains/` represents a bounded context — a distinct area of responsibility with its own language, rules, and lifecycle.

Domains define _what_ the system is responsible for. Implementation lives in `apps/`, `packages/`, and `services/`, mapped to the domain they serve.

See [docs/architecture/lateen-os-v1.md](../docs/architecture/lateen-os-v1.md) — **Lateen OS Architecture v1.0 Locked**.

## Domains

| Domain                          | Responsibility                                                |
| ------------------------------- | ------------------------------------------------------------- |
| [business-dna](./business-dna/) | Canonical business model — single source of truth for the org |
| [core](./core/)                 | Platform capabilities: identity, security, messaging, search  |
| [intelligence](./intelligence/) | Analysis, discovery, forecasting, and recommendations         |
| [ai-workforce](./ai-workforce/) | AI agents operating as digital workers across the org         |
| [marketing](./marketing/)       | Brand, positioning, and market communication                  |
| [sales](./sales/)               | Revenue acquisition and commercial relationships              |
| [operations](./operations/)     | Day-to-day execution and process delivery                     |
| [finance](./finance/)           | Financial planning, accounting, and reporting                 |
| [products](./products/)         | Product catalog, lifecycle, and offerings                     |
| [machines](./machines/)         | Automation, integrations, and system orchestration            |
| [projects](./projects/)         | Initiative planning, delivery, and tracking                   |
| [customers](./customers/)       | Customer relationships and lifecycle management               |
| [memory](./memory/)             | Institutional Memory — organizational history and context     |

## Layering

```
Layer 1  business-dna   ←  single source of truth
Layer 2  core           ←  platform services
Layer 3  intelligence   ←  analysis and discovery
Layer 4  ai-workforce   ←  AI agents
Layer 5  business domains
Layer 6  apps/
Layer 7  infrastructure/
```
