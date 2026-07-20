# Business DNA Studio — UI Flow

## Primary Navigation

```
Sidebar
├── Overview
│   └── Dashboard (/)
├── Business DNA
│   ├── Organization (/organization)
│   ├── Branches (/entities/branches)
│   ├── Departments (/entities/departments)
│   ├── … (all entity views)
│   └── Capabilities (/entities/capabilities)
└── Visual Editors
    ├── Organization Chart
    ├── Capability Graph
    ├── Workflow Designer
    ├── Machine Layout
    ├── Department Hierarchy
    └── AI Workforce Hierarchy
```

## Dashboard Flow

1. User lands on `/`
2. Studio fetches `/api/studio/dashboard`
3. Stat cards show entity counts
4. Charts render org health, capability coverage, machine utilization, department size, AI workforce distribution
5. Integration status panel shows connected platform services

## Entity CRUD Flow

1. User selects entity from sidebar (e.g. Products)
2. `EntityPage` loads list via `/api/business-dna/organizations/current/products`
3. User clicks **Add** → form with registry-defined fields
4. On save:
   - POST `/api/studio/validate` checks required fields
   - POST to BDS creates entity
   - Query cache invalidates
5. User selects row → **Impact Analysis** tab shows dependents
6. Edit/Delete actions on each row

## Organization Flow

1. User opens `/organization`
2. Fetches current org via `/api/business-dna/organizations/current`
3. Edit name/code → PUT to same endpoint

## Capabilities Flow

1. User opens `/entities/capabilities`
2. Dashboard data derives capabilities from products + machines
3. User opens **Capability Graph** editor for relationship visualization

## Visual Editor Flows

### Organization Chart

Org node → branches → departments (animated edges)

### Capability Graph

Products (top row) connected to machines (bottom row) with "enables" edges

### Workflow Designer

Local workflow definition:
- Name input
- Sequential steps (vertical flow)
- Step 4 labeled as Decision Engine integration point
- Add Step button appends nodes

### Machine Layout

Grid layout of machine nodes — draggable positions

### Department Hierarchy

Tree from first department as root

### AI Workforce Hierarchy

Root "AI Workforce" node → agent nodes by workforce type

## Validation & Impact

| Action | Endpoint | Result |
| ------ | -------- | ------ |
| Validate before save | POST `/api/studio/validate` | errors + warnings |
| Impact on select | GET `/api/studio/impact` | dependents + risk level |

## Error States

- BDS unavailable → 502 from BFF, error message on page
- Empty list → "No entities found" with create CTA
- Non-listable entity → info card with create-only form
