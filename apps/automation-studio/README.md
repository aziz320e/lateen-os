# Automation Studio

**Automation Studio** is the official no-code automation designer for Lateen OS. It visually composes workflows, missions, AI workers, decisions, connectors, services, and business events.

## Boundaries

| Concern | Owner |
| ------- | ----- |
| Workflow execution | Workflow Engine |
| Mission scheduling | Mission Scheduler |
| AI execution | AI Runtime |
| Worker lifecycle | AI Workforce |
| Decision approval | Decision Engine |

Automation Studio does **not** execute automation.

## Technology

- Next.js 15, React 19, TypeScript
- Tailwind CSS, shadcn-style UI (Radix)
- React Flow (workflow builder)
- Monaco Editor (condition builder)
- TanStack Query, Recharts

## Sections

Dashboard · Automations · Workflow Builder · Mission Builder · Decision Builder · Trigger Library · Action Library · Condition Builder · Variables · Schedules · Connector Library · Templates · Executions · Logs · Analytics · Marketplace · Settings

## Development

```bash
pnpm --filter @lateen-os/automation-studio dev    # http://localhost:3010
pnpm --filter @lateen-os/automation-studio build
pnpm --filter @lateen-os/automation-studio typecheck
pnpm --filter @lateen-os/automation-studio test
```

## BFF API

| Route | Purpose |
| ----- | ------- |
| `GET/POST /api/automations` | Automation designs |
| `GET/PUT /api/automations/:id` | Automation detail |
| `POST /api/automations/validate` | Design-time validation |
| `GET /api/templates` | Automation templates |
| `GET /api/executions` | Execution records |
| `GET /api/executions/:id` | Execution detail |
| `GET /api/analytics` | Usage analytics |
| `GET/POST /api/marketplace` | Marketplace listings |
| `GET /api/triggers` | Trigger library |
| `GET /api/actions` | Action library |
| `GET /api/connectors` | Connector library |
| `GET /api/logs` | Execution logs |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [WORKFLOW_BUILDER.md](./WORKFLOW_BUILDER.md)
- [MISSION_BUILDER.md](./MISSION_BUILDER.md)
- [AUTOMATION_MODEL.md](./AUTOMATION_MODEL.md)

## Port

**3010**
