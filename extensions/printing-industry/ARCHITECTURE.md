# Printing Industry Pack — Architecture

Architecture v1.0 — industry pack extension, no business logic.

## Type

- Extension type: `industry-pack`
- Industry: `printing`
- Marketplace installable

## Structure

```
extensions/printing-industry/
├── extension.json          # Extension manifest
├── src/
│   ├── catalog/            # Products, machines, materials, capabilities
│   ├── workflows/          # 8 workflow templates
│   ├── missions/           # 6 mission templates
│   ├── workers/            # 6 AI worker templates
│   ├── dashboards/         # 6 dashboard templates
│   ├── reports/            # 6 report templates
│   ├── templates/          # Org, departments, KPIs, policies, documents
│   ├── pack.ts             # Aggregated pack export
│   └── index.ts            # Public API
└── tests/
```

## Integration

| Platform | Integration |
| -------- | ----------- |
| Extension System | Discovery via `extensions/printing-industry/extension.json` |
| Marketplace | Installable as `printing-industry` |
| Business DNA | Template shapes align with product/machine entities (read-only) |
| Workflow Engine | Workflow template IDs registered in manifest |
| Mission Scheduler | Mission template IDs registered in manifest |
| AI Workforce | Worker template IDs registered in manifest |

## Constraints

- Kernel — not modified
- Business DNA — not modified
- SDK — not modified
- No runtime business logic — templates and catalog only
