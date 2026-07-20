# AI Agent

## Purpose

An **AI Agent** is a registered AI worker within the Organization. AI agents are first-class Business DNA entities — they consume Business DNA for context, operate under defined roles and permissions, and function in both Reactive and Proactive modes.

## Responsibilities

- Register each AI worker with identity, role, and scope in Business DNA
- Bind agents to ai-workforce domain definitions (CEO AI, Sales AI, etc.)
- Define permissions and delegation boundaries for agent actions
- Enable Proactive AI monitoring of Business DNA, Institutional Memory, Intelligence, and KPIs

## Attributes

| Attribute             | Type     | Required | Description                                                                                                 |
| --------------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `id`                  | UUID     | Yes      | Stable unique identifier                                                                                    |
| `organizationId`      | UUID     | Yes      | Owning organization                                                                                         |
| `code`                | String   | Yes      | Agent code, unique within organization                                                                      |
| `name`                | String   | Yes      | Agent display name                                                                                          |
| `description`         | String   | No       | Agent purpose and capabilities                                                                              |
| `workforceType`       | Enum     | Yes      | `ceo_ai`, `marketing_ai`, `sales_ai`, `operations_ai`, `finance_ai`, `product_manager_ai`, `hr_ai`, `rd_ai` |
| `status`              | Enum     | Yes      | `draft`, `active`, `paused`, `suspended`, `decommissioned`, `archived`                                      |
| `departmentId`        | UUID     | No       | Primary department scope                                                                                    |
| `supervisorId`        | UUID     | No       | Employee supervisor                                                                                         |
| `delegatedEmployeeId` | UUID     | No       | Employee the agent acts on behalf of                                                                        |
| `proactiveEnabled`    | Boolean  | Yes      | Whether Proactive Mode is enabled                                                                           |
| `reactiveEnabled`     | Boolean  | Yes      | Whether Reactive Mode is enabled                                                                            |
| `lastProactiveRunAt`  | DateTime | No       | Last proactive monitoring cycle                                                                             |
| `identityId`          | UUID     | No       | Link to Core identity record                                                                                |
| `createdAt`           | DateTime | Yes      | Record creation timestamp                                                                                   |
| `updatedAt`           | DateTime | Yes      | Last modification timestamp                                                                                 |

## Relationships

| Related Entity | Cardinality | Description                            |
| -------------- | ----------- | -------------------------------------- |
| Organization   | many → 1    | Agent belongs to one organization      |
| Department     | many → 1    | Primary department scope               |
| Employee       | many → 1    | Supervisor or delegated employee       |
| Role           | many → many | Roles assigned to the agent            |
| Permission     | many → many | Permissions via roles or direct grants |
| KPI            | many → many | KPIs monitored proactively             |
| Workflow       | many → many | Workflow stages assigned to agent      |
| Machine        | many → many | Machines orchestrated by agent         |
| Policy         | many → many | Policies governing agent behavior      |

## Lifecycle

```
draft → active → paused → active → suspended → decommissioned → archived
```

| State            | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `draft`          | Agent registered; not yet operational                        |
| `active`         | Agent operational in enabled modes                           |
| `paused`         | Agent temporarily stopped; no reactive or proactive activity |
| `suspended`      | Agent blocked by policy or administrator                     |
| `decommissioned` | Agent permanently retired                                    |
| `archived`       | Record retained for audit only                               |

## Events

| Event                               | Trigger                              |
| ----------------------------------- | ------------------------------------ |
| `ai_agent.created`                  | New agent registered                 |
| `ai_agent.activated`                | Agent moved to active                |
| `ai_agent.paused`                   | Agent paused                         |
| `ai_agent.resumed`                  | Agent resumed                        |
| `ai_agent.suspended`                | Agent suspended                      |
| `ai_agent.decommissioned`           | Agent decommissioned                 |
| `ai_agent.archived`                 | Agent archived                       |
| `ai_agent.proactive_run`            | Proactive monitoring cycle completed |
| `ai_agent.recommendation_generated` | Proactive recommendation produced    |
| `ai_agent.updated`                  | Any attribute changed                |

## Business Rules

- Agent `code` must be unique within the organization.
- At least one of `proactiveEnabled` or `reactiveEnabled` must be true for an active agent.
- Agents consume Business DNA exclusively; they must not maintain local business entity copies.
- Agent permissions must flow through Role and Permission entities; undeclared actions are denied by Core authorization.
- Proactive recommendations must reference the KPI, entity, or intelligence source that triggered them.
- Suspended agents reject all reactive requests and skip proactive cycles.
- Decommissioned agents cannot be reactivated; a new registration is required.
