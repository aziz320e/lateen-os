# CEO Cockpit — UI Flow

## Navigation Structure

```
CEO Cockpit
├── Executive
│   ├── Dashboard (/)
│   ├── Company Health (/health)
│   ├── Risk Center (/risk)
│   └── Finance Overview (/finance)
├── Enterprise
│   ├── Organization (/organization)
│   ├── Business DNA (/business-dna)
│   ├── Capabilities (/capabilities)
│   ├── Products (/products)
│   ├── Customers (/customers)
│   └── Operations (/operations)
├── Intelligence
│   ├── Mission Control (/missions)
│   ├── AI Workforce (/workforce)
│   ├── Workflow Monitor (/workflows)
│   ├── Decision Center (/decisions)
│   └── Institutional Memory (/memory)
└── Platform
    ├── Observability (/observability)
    └── Audit Center (/audit)
```

## Executive Dashboard Flow

1. User lands on `/` → `GET /api/dashboard`
2. Stat cards show health, missions, decisions, workforce
3. Drag-and-drop widget grid displays:
   - Platform health pie chart
   - Mission control summary
   - Decision queue
   - Entity bar chart
   - AI workforce list
   - Risk summary
   - Finance snapshot
   - Alerts
4. User can **Save Layout** or **Reset** widget positions

## Mission Control Flow

1. Navigate to `/missions`
2. `GET /api/missions` proxies AI Product Manager
3. View running, completed, escalated, rejected missions
4. Mission timeline shows stage-by-stage progress

## Decision Center Flow

1. Navigate to `/decisions`
2. `GET /api/decisions` aggregates AI PM + Discovery
3. Tabs: Pending → Approved → Rejected → Policies

## Observability Flow

1. Navigate to `/observability`
2. `GET /api/platform/health` probes all services
3. Health grid grouped by: Services, Infrastructure, Data Stores
4. Auto-refreshes every 30 seconds

## Notifications

- Bell icon in top bar shows unread alert count
- Alerts derived from escalated missions, pending decisions, risk items
- Types: mission, decision, risk, ai

## Organization Graph

- React Flow visualization on `/organization`
- Org node → Department nodes → Employee nodes
- Data from Business DNA Service
