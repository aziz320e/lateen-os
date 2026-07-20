# Organization

> **Enrichment:** Business DNA Enrichment v1 — Lateen-specific

## Purpose

The **Organization** entity represents **Lateen** — an AI-first printing, manufacturing, and visual communications company operating across Saudi Arabia and the GCC.

Lateen produces signage, branding materials, construction graphics, packaging, and custom manufactured goods. The Organization record is the root of Business DNA: it anchors production facilities, print fleets, AI agents, enterprise customer contracts, and nationwide rollout projects.

Every other Business DNA entity belongs to exactly one Lateen Organization.

## Responsibilities

- Define Lateen's legal identity, trade licenses, and ZATCA tax registration
- Declare AI-first operating model — AI Workforce agents are primary coordinators, not optional add-ons
- Anchor production branches (print shops, fabrication plants, install crews)
- Hold organization-wide defaults: SAR currency, Arabic/English locale, AST timezone
- Govern which AI agents, machines, and production lines are authorized to operate
- Set enterprise SLA tiers and contract frameworks applied to B2B customers

## Attributes

### Core Identity

| Attribute            | Type     | Required | Description                                |
| -------------------- | -------- | -------- | ------------------------------------------ |
| `id`                 | UUID     | Yes      | Stable unique identifier                   |
| `code`               | String   | Yes      | Organization code (e.g. `LATEEN`)          |
| `name`               | String   | Yes      | Trading name                               |
| `legalName`          | String   | Yes      | Registered legal entity name               |
| `registrationNumber` | String   | Yes      | CR (Commercial Registration) number        |
| `taxId`              | String   | Yes      | ZATCA VAT registration number              |
| `status`             | Enum     | Yes      | `draft`, `active`, `suspended`, `archived` |
| `defaultCurrency`    | ISO 4217 | Yes      | Primary currency (`SAR`)                   |
| `defaultLocale`      | BCP 47   | Yes      | Default locale (`ar-SA`, `en-SA`)          |
| `timezone`           | IANA     | Yes      | Primary timezone (`Asia/Riyadh`)           |
| `foundedAt`          | Date     | No       | Date of establishment                      |

### AI-First Operations

| Attribute               | Type    | Required | Description                                                                                         |
| ----------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------- |
| `operatingModel`        | Enum    | Yes      | `ai_first` — AI agents lead monitoring, scheduling, and recommendations; humans approve and execute |
| `proactiveAiEnabled`    | Boolean | Yes      | Organization-wide Proactive AI toggle                                                               |
| `aiCouncilPolicyId`     | UUID    | No       | Policy governing AI agent behavior across the org                                                   |
| `defaultAiSupervisorId` | UUID    | No       | Employee accountable for AI Workforce oversight                                                     |
| `aiDecisionThreshold`   | Enum    | No       | `informational`, `recommendation`, `approval_required` — default escalation for AI outputs          |
| `registeredAgentCount`  | Integer | No       | Count of active AI agents (derived, not manually set)                                               |

### Production & Commercial

| Attribute             | Type   | Required | Description                                                                                                                      |
| --------------------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `industryVerticals`   | Enum[] | Yes      | `signage`, `branding`, `construction_graphics`, `packaging`, `retail_print`, `corporate_print`, `vehicle_wrapping`, `exhibition` |
| `productionModel`     | Enum   | Yes      | `make_to_order`, `make_to_stock`, `hybrid`                                                                                       |
| `serviceCoverage`     | Enum   | Yes      | `local`, `regional`, `nationwide` — geographic delivery capability                                                               |
| `defaultPaymentTerms` | String | No       | Default B2B terms (e.g. `net_30`)                                                                                                |
| `defaultSlaTier`      | Enum   | No       | `standard`, `priority`, `enterprise`                                                                                             |

### Audit

| Attribute   | Type     | Required | Description                 |
| ----------- | -------- | -------- | --------------------------- |
| `createdAt` | DateTime | Yes      | Record creation timestamp   |
| `updatedAt` | DateTime | Yes      | Last modification timestamp |

## Relationships

| Related Entity | Cardinality | Description                                              |
| -------------- | ----------- | -------------------------------------------------------- |
| Branch         | 1 → many    | Production facilities, install hubs, regional offices    |
| Department     | 1 → many    | Print, fabrication, install, sales, AI operations        |
| Employee       | 1 → many    | Production staff, installers, account managers           |
| Machine        | 1 → many    | Print and manufacturing equipment fleet                  |
| Product        | 1 → many    | Lateen product catalog                                   |
| Customer       | 1 → many    | B2B and enterprise clients                               |
| Project        | 1 → many    | Signage, branding, construction, rollout projects        |
| AI Agent       | 1 → many    | Full AI Workforce registered to Lateen                   |
| KPI            | 1 → many    | Production, margin, SLA, and AI performance KPIs         |
| Policy         | 1 → many    | Production, safety, AI governance, and contract policies |
| Workflow       | 1 → many    | Print-to-delivery and approval workflows                 |

## Lifecycle

```
draft → active → suspended → archived
```

| State       | Description                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| `draft`     | Lateen entity registered; production lines and AI agents not yet authorized |
| `active`    | Full operations — production, AI agents, and enterprise contracts enabled   |
| `suspended` | Production halted; AI proactive mode disabled; read-only except archival    |
| `archived`  | Organization closed; all records retained for audit                         |

## Events

| Event                                   | Trigger                                            |
| --------------------------------------- | -------------------------------------------------- |
| `organization.created`                  | Lateen organization record created                 |
| `organization.activated`                | Organization moved to active; AI agents authorized |
| `organization.suspended`                | Organization suspended; proactive AI halted        |
| `organization.archived`                 | Organization archived                              |
| `organization.ai_policy_updated`        | AI governance policy changed                       |
| `organization.production_model_changed` | Production model updated                           |
| `organization.updated`                  | Any attribute changed                              |

## Business Rules

- Lateen Organization `operatingModel` must be `ai_first`; this is not configurable to legacy/manual mode in v1.
- Proactive AI cannot be enabled for individual agents if `proactiveAiEnabled` is false at organization level.
- At least one active Branch of type production facility is required before organization activation.
- All production Machine records must belong to an active Branch before they can accept jobs.
- Enterprise SLA tiers cascade to Customer records unless overridden per contract.
- AI agents inherit organization scope; Operations AI and Product Manager AI monitor production KPIs proactively by default.
- Suspended organizations halt all Machine job queues and AI proactive cycles immediately.
