# Commands

Lateen Assistant supports slash commands and natural language aliases. All commands orchestrate existing services.

| Command | Alias | Service |
| ------- | ----- | ------- |
| `/create-customer` | create customer | Business DNA Service |
| `/create-quotation` | create quotation | Business DNA Service |
| `/create-project` | create project | Business DNA Service |
| `/launch-product` | launch product | AI Product Manager |
| `/run-discovery` | run product discovery | Product Discovery |
| `/approve-decision` | approve decision | AI Product Manager |
| `/assign-worker` | assign ai worker | Business DNA (agents) |
| `/start-workflow` | start workflow | Business DNA / Workflow Engine |
| `/company-health` | show company health | CEO Cockpit + BDS |
| `/ceo-dashboard` | show ceo dashboard | CEO Cockpit |
| `/search-memory` | search institutional memory | CEO Cockpit + aggregated memory |
| `/explain-decisions` | explain decisions | AI Product Manager |
| `/report` | generate report | Multi-service aggregation |
| `/help` | help | Lateen Assistant |

## Command palette

Press **⌘K** (Ctrl+K) to search commands globally.

## Keyboard shortcuts

| Shortcut | Action |
| -------- | ------ |
| ⌘K | Open command palette |
| Enter | Send message |
| ⌘Enter | Stream response |

## API

```http
GET /api/commands?q=customer
POST /api/commands { "command": "/launch-product" }
```

## Routing rules

1. Slash prefix takes priority
2. Natural language keywords matched case-insensitively
3. Unknown input returns help suggestions
4. Errors surface downstream service messages — no local business logic
