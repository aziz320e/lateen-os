# AI Studio

**AI Studio** is the official no-code environment for designing, configuring, testing, deploying, and monitoring AI Workers on Lateen OS.

## Boundaries

| Concern | Owner |
| ------- | ----- |
| AI execution | AI Runtime |
| Worker lifecycle | AI Workforce |
| Decision approval | Decision Engine |
| Workflow execution | Workflow Engine |

AI Studio does **not** execute AI. It provides UI and BFF contracts only.

## Technology

- Next.js 15, React 19, TypeScript
- Tailwind CSS, shadcn-style UI (Radix)
- React Flow (workflow designer)
- TanStack Query (data fetching)
- Monaco Editor (prompt studio)
- Recharts (analytics)

## Sections

Dashboard · Workers · Skills · Tools · Permissions · Memory · Goals · Knowledge · Workflows · Missions · Runtime · Analytics · Deployments · Templates · Marketplace · Prompt Studio · Testing

## Development

```bash
pnpm --filter @lateen-os/ai-studio dev    # http://localhost:3009
pnpm --filter @lateen-os/ai-studio build
pnpm --filter @lateen-os/ai-studio typecheck
pnpm --filter @lateen-os/ai-studio test
```

## BFF API

| Route | Purpose |
| ----- | ------- |
| `GET/POST /api/workers` | Worker designs |
| `GET/PUT /api/workers/:id` | Worker detail |
| `GET/PUT /api/workers/:id/prompt` | Prompt design |
| `GET /api/templates` | Worker templates |
| `GET/POST /api/deployments` | Deployment records |
| `GET /api/analytics` | Usage analytics |
| `GET/POST /api/marketplace` | Marketplace listings |
| `POST /api/testing/sandbox` | Sandbox test (stub) |
| `GET /api/knowledge` | Knowledge bindings |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [WORKER_DESIGNER.md](./WORKER_DESIGNER.md)
- [PROMPT_STUDIO.md](./PROMPT_STUDIO.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Port

**3009**
