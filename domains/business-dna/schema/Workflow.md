# Workflow

## Purpose

A **Workflow** defines a business process and its stages within the Organization. Workflows orchestrate approvals, fulfillment, and cross-domain operations as defined in Business DNA.

## Responsibilities

- Define process stages, transitions, and required actors
- Bind roles, employees, machines, and AI agents to workflow steps
- Govern approval chains for quotations, orders, invoices, and policies
- Provide the canonical process definition that domains execute

## Attributes

| Attribute        | Type     | Required | Description                                                      |
| ---------------- | -------- | -------- | ---------------------------------------------------------------- |
| `id`             | UUID     | Yes      | Stable unique identifier                                         |
| `organizationId` | UUID     | Yes      | Owning organization                                              |
| `code`           | String   | Yes      | Workflow code, unique within organization                        |
| `name`           | String   | Yes      | Workflow display name                                            |
| `description`    | String   | No       | Process purpose and scope                                        |
| `type`           | Enum     | Yes      | `approval`, `fulfillment`, `onboarding`, `procurement`, `custom` |
| `status`         | Enum     | Yes      | `draft`, `active`, `inactive`, `archived`                        |
| `entityType`     | String   | No       | Target entity (e.g. `order`, `invoice`, `employee`)              |
| `departmentId`   | UUID     | No       | Owning department                                                |
| `version`        | Integer  | Yes      | Workflow version number                                          |
| `createdAt`      | DateTime | Yes      | Record creation timestamp                                        |
| `updatedAt`      | DateTime | Yes      | Last modification timestamp                                      |

### Stage Attributes

| Attribute         | Type    | Required | Description                          |
| ----------------- | ------- | -------- | ------------------------------------ |
| `stageId`         | UUID    | Yes      | Stage identifier                     |
| `name`            | String  | Yes      | Stage name                           |
| `order`           | Integer | Yes      | Sequence order                       |
| `requiredRoleId`  | UUID    | No       | Role required to act at this stage   |
| `requiredAgentId` | UUID    | No       | AI agent assigned to this stage      |
| `machineId`       | UUID    | No       | Machine executing this stage         |
| `autoAdvance`     | Boolean | No       | Whether stage advances automatically |

## Relationships

| Related Entity | Cardinality | Description                          |
| -------------- | ----------- | ------------------------------------ |
| Organization   | many → 1    | Workflow belongs to one organization |
| Department     | many → 1    | Owning department                    |
| Role           | many → many | Roles required at stages             |
| AI Agent       | many → many | Agents assigned to stages            |
| Machine        | many → many | Machines executing stages            |
| Policy         | many → many | Policies governing workflow behavior |
| Quotation      | many → many | Quotation approval workflows         |
| Order          | many → many | Order fulfillment workflows          |
| Invoice        | many → many | Invoice approval workflows           |

## Lifecycle

```
draft → active → inactive → archived
```

| State      | Description                                   |
| ---------- | --------------------------------------------- |
| `draft`    | Workflow defined; not yet executable          |
| `active`   | Workflow available for process instances      |
| `inactive` | No new instances; existing instances complete |
| `archived` | Retired; read-only                            |

## Events

| Event                         | Trigger                        |
| ----------------------------- | ------------------------------ |
| `workflow.created`            | New workflow defined           |
| `workflow.activated`          | Workflow moved to active       |
| `workflow.deactivated`        | Workflow moved to inactive     |
| `workflow.archived`           | Workflow archived              |
| `workflow.version_published`  | New version published          |
| `workflow.instance_started`   | Process instance started       |
| `workflow.stage_completed`    | Stage completed in an instance |
| `workflow.instance_completed` | Process instance completed     |
| `workflow.updated`            | Any attribute changed          |

## Business Rules

- Workflow `code` plus `version` must be unique within the organization.
- Active workflows must have at least one stage.
- Stage order values must be unique and sequential within a workflow version.
- Inactive workflows reject new instances but allow in-flight instances to complete.
- Version changes create a new version; existing instances remain on their originating version.
