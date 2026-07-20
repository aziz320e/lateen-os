# Project

> **Enrichment:** Business DNA Enrichment v1 — Lateen-specific

## Purpose

A **Project** at Lateen is a **delivered engagement** — a signage program, branding rollout, construction site graphics package, or nationwide multi-site installation spanning design, production, logistics, and on-site execution.

Projects are how Lateen coordinates complex work that exceeds a single order: a retail chain rebranding 200 stores, a developer wrapping 5 km of hoarding, or a government wayfinding system across multiple cities.

## Responsibilities

- Define scope, deliverables, and phasing for multi-product engagements
- Coordinate design, production, installation, and nationwide logistics
- Track rollout progress across customer sites and geographic regions
- Link products, machines, install crews, and AI agents to delivery phases
- Anchor budget, margin, and SLA commitments for enterprise customers
- Manage project-specific workflows — site surveys, proofs, installs, sign-off

## Attributes

### Core Identity

| Attribute           | Type   | Required | Description                                                                                                 |
| ------------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`                | UUID   | Yes      | Stable unique identifier                                                                                    |
| `organizationId`    | UUID   | Yes      | Owning organization (Lateen)                                                                                |
| `code`              | String | Yes      | Project code (e.g. `PRJ-ALDAWS-REBRAND-2026`)                                                               |
| `name`              | String | Yes      | Project name                                                                                                |
| `description`       | String | No       | Scope summary and objectives                                                                                |
| `status`            | Enum   | Yes      | `draft`, `planned`, `design`, `production`, `installation`, `on_hold`, `completed`, `cancelled`, `archived` |
| `priority`          | Enum   | No       | `standard`, `priority`, `critical`                                                                          |
| `customerId`        | UUID   | No       | Customer account (required for customer-facing projects)                                                    |
| `contractReference` | String | No       | Link to Customer enterprise contract                                                                        |
| `ownerId`           | UUID   | Yes      | Project manager (Employee)                                                                                  |
| `branchId`          | UUID   | No       | Lead production branch                                                                                      |
| `departmentId`      | UUID   | No       | Owning department                                                                                           |

### Project Classification

| Attribute         | Type | Required | Description                                                                                             |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------- |
| `projectType`     | Enum | Yes      | See [Project Types](#project-types)                                                                     |
| `deliveryModel`   | Enum | Yes      | `single_site`, `multi_site`, `nationwide_rollout`, `phased_rollout`, `ongoing_program`                  |
| `industryContext` | Enum | No       | `retail`, `construction`, `government`, `hospitality`, `healthcare`, `banking`, `events`, `real_estate` |

### Scope & Deliverables

| Attribute              | Type     | Required | Description                                 |
| ---------------------- | -------- | -------- | ------------------------------------------- |
| `productIds`           | UUID[]   | No       | Products specified in project               |
| `estimatedQuantity`    | Decimal  | No       | Total estimated production units            |
| `quantityUnit`         | String   | No       | Unit of measure for estimated quantity      |
| `siteCount`            | Integer  | No       | Number of installation/delivery sites       |
| `siteLocations`        | Object[] | No       | Array of site definitions                   |
| `designRequired`       | Boolean  | No       | Whether custom design phase is needed       |
| `proofRequired`        | Boolean  | No       | Whether customer proof approval is required |
| `installationRequired` | Boolean  | No       | Whether on-site installation is included    |
| `siteSurveyRequired`   | Boolean  | No       | Whether pre-install site surveys are needed |

#### Site Location Object

| Field                | Type     | Description                                                                |
| -------------------- | -------- | -------------------------------------------------------------------------- |
| `siteId`             | UUID     | Site identifier                                                            |
| `name`               | String   | Site name (e.g. store name, plot number)                                   |
| `address`            | Address  | Site address                                                               |
| `region`             | Enum     | `central`, `western`, `eastern`, `northern`, `southern`                    |
| `city`               | String   | City                                                                       |
| `installStatus`      | Enum     | `pending`, `surveyed`, `in_production`, `ready`, `installed`, `signed_off` |
| `assignedCrewId`     | UUID     | Install crew (Employee group reference)                                    |
| `scheduledInstallAt` | DateTime | Planned installation date                                                  |

### Rollout & Phasing

| Attribute            | Type     | Required | Description                                      |
| -------------------- | -------- | -------- | ------------------------------------------------ |
| `rolloutPhases`      | Object[] | No       | Phased delivery schedule for nationwide rollouts |
| `currentPhase`       | Integer  | No       | Active phase number                              |
| `rolloutProgressPct` | Decimal  | No       | Overall rollout completion percentage (derived)  |
| `sitesCompleted`     | Integer  | No       | Sites with signed-off installation (derived)     |
| `sitesRemaining`     | Integer  | No       | Sites pending (derived)                          |

#### Rollout Phase Object

| Field              | Type    | Description                                    |
| ------------------ | ------- | ---------------------------------------------- |
| `phaseNumber`      | Integer | Phase sequence                                 |
| `name`             | String  | Phase name (e.g. `Phase 1 — Riyadh & Central`) |
| `region`           | Enum[]  | Regions covered in this phase                  |
| `siteIds`          | UUID[]  | Sites included                                 |
| `plannedStartDate` | Date    | Phase start                                    |
| `plannedEndDate`   | Date    | Phase end                                      |
| `status`           | Enum    | `planned`, `active`, `completed`               |

### Financial & SLA

| Attribute         | Type     | Required | Description                      |
| ----------------- | -------- | -------- | -------------------------------- |
| `budget`          | Decimal  | No       | Total project budget (SAR)       |
| `actualCost`      | Decimal  | No       | Running actual cost (derived)    |
| `revenue`         | Decimal  | No       | Contracted project revenue (SAR) |
| `currency`        | ISO 4217 | Yes      | Currency (`SAR`)                 |
| `marginTargetPct` | Decimal  | No       | Target project margin            |
| `slaTier`         | Enum     | No       | Inherited from Customer contract |
| `slaDeliveryDate` | Date     | No       | Contractual final delivery date  |

### Timeline

| Attribute            | Type     | Required | Description                      |
| -------------------- | -------- | -------- | -------------------------------- |
| `startDate`          | Date     | No       | Project start date               |
| `designDeadline`     | Date     | No       | Design deliverable deadline      |
| `productionDeadline` | Date     | No       | Production completion deadline   |
| `installDeadline`    | Date     | No       | Installation completion deadline |
| `endDate`            | Date     | No       | Project close date               |
| `completedAt`        | DateTime | No       | Actual completion timestamp      |

### AI & Monitoring

| Attribute             | Type     | Required | Description                                 |
| --------------------- | -------- | -------- | ------------------------------------------- |
| `operationsAiAgentId` | UUID     | No       | Operations AI monitoring this project       |
| `riskStatus`          | Enum     | No       | `on_track`, `at_risk`, `delayed`, `blocked` |
| `aiLastReviewAt`      | DateTime | No       | Last proactive AI project review            |
| `aiSummary`           | String   | No       | AI-generated project status summary         |

### Audit

| Attribute   | Type     | Required | Description                 |
| ----------- | -------- | -------- | --------------------------- |
| `createdAt` | DateTime | Yes      | Record creation timestamp   |
| `updatedAt` | DateTime | Yes      | Last modification timestamp |

### Project Types

| Type                     | Description                                             | Examples                                                     |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| `signage_program`        | Multi-unit signage design, production, and installation | Store fascia signs, pylon signs, wayfinding systems          |
| `branding_rollout`       | Corporate identity deployment across sites              | Rebrand, new logo rollout, brand asset deployment            |
| `construction_graphics`  | Construction site visual communications                 | Hoarding wraps, tower wraps, safety signage, plot branding   |
| `nationwide_rollout`     | Large-scale multi-region deployment                     | Retail chain rollout, franchise branding, government signage |
| `exhibition_event`       | Time-bound event or exhibition graphics                 | Stand builds, event branding, temporary installations        |
| `vehicle_fleet`          | Fleet branding program                                  | Company vehicle wraps across a fleet                         |
| `architectural_graphics` | Building and interior visual installations              | Wall murals, decorative panels, lobby branding               |
| `maintenance_program`    | Ongoing sign maintenance and replacement                | Annual sign audit and refresh programs                       |

## Relationships

| Related Entity | Cardinality | Description                                        |
| -------------- | ----------- | -------------------------------------------------- |
| Organization   | many → 1    | Project belongs to Lateen                          |
| Customer       | many → 1    | Enterprise customer account                        |
| Branch         | many → many | Production and install branches per region         |
| Department     | many → 1    | Owning department                                  |
| Employee       | many → many | Project manager, designers, install crews          |
| Product        | many → many | Products in project scope                          |
| Machine        | many → many | Production machines allocated                      |
| Order          | 1 → many    | Orders generated per phase or site                 |
| Workflow       | many → many | Design approval, proof, install sign-off workflows |
| KPI            | many → many | Rollout progress, margin, SLA KPIs                 |
| AI Agent       | many → many | Operations AI, Sales AI, Product Manager AI        |
| Asset          | many → many | Install equipment, templates, proofs               |

## Lifecycle

```
draft → planned → design → production → installation → completed → archived
                      ↓         ↓              ↓
                   on_hold ← on_hold ← on_hold
                      ↓
                  cancelled → archived
```

| State          | Description                                        |
| -------------- | -------------------------------------------------- |
| `draft`        | Project opportunity captured; scope not finalized  |
| `planned`      | Scope, budget, and timeline approved               |
| `design`       | Design and proofing phase active                   |
| `production`   | Production phase active across machines            |
| `installation` | On-site installation and rollout active            |
| `on_hold`      | Project paused — client, credit, or logistics hold |
| `completed`    | All sites signed off; project closed               |
| `cancelled`    | Project terminated before completion               |
| `archived`     | Record retained for audit only                     |

## Events

| Event                          | Trigger                                 |
| ------------------------------ | --------------------------------------- |
| `project.created`              | New project created                     |
| `project.planned`              | Project approved and planned            |
| `project.design_started`       | Design phase started                    |
| `project.design_approved`      | Customer approved design/proof          |
| `project.production_started`   | Production phase started                |
| `project.production_completed` | All production finished                 |
| `project.installation_started` | Installation phase started              |
| `project.site_installed`       | Single site installation completed      |
| `project.site_signed_off`      | Customer signed off a site              |
| `project.phase_completed`      | Rollout phase completed                 |
| `project.on_hold`              | Project paused                          |
| `project.resumed`              | Project resumed                         |
| `project.completed`            | All phases and sites complete           |
| `project.cancelled`            | Project cancelled                       |
| `project.archived`             | Project archived                        |
| `project.risk_elevated`        | AI flagged at_risk, delayed, or blocked |
| `project.updated`              | Any attribute changed                   |

## Business Rules

- Customer-facing projects must reference an active Customer with a valid contract or approved quotation.
- Nationwide rollouts (`deliveryModel: nationwide_rollout`) must define at least one `rolloutPhase` before moving to `planned`.
- Each site must complete `siteSurveyRequired` survey before installation scheduling when flag is true.
- Installation cannot begin on a site until associated production orders are fulfilled.
- `rolloutProgressPct` is derived from `sitesCompleted / siteCount`; manual override is prohibited.
- Budget overrun beyond 10% of `budget` triggers proactive alert from Finance AI and project manager.
- SLA breach on `slaDeliveryDate` triggers escalation to Operations AI and account manager.
- Completed projects cannot be reactivated; follow-on work requires a new project linked to the same customer.
- Projects in `construction_graphics` type require safety compliance policy acknowledgment before production.
