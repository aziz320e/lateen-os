# Business DNA

The **Business DNA** domain is the canonical business model of the organization within Lateen OS.

It is the **single source of truth** for how the business is structured, who participates in it, what it offers, and how it operates. Every domain and every AI agent reads from Business DNA — none may invent or maintain a parallel business model.

## Schema

The canonical entity specifications live in [schema/](./schema/). Each file defines purpose, responsibilities, attributes, relationships, lifecycle, events, and business rules for one core entity.

**Business DNA Enrichment v1** refines Organization, Machine, Product, Customer, and Project for Lateen's AI-first printing and manufacturing operations.

## Single source of truth

Business DNA owns the authoritative definitions for:

| Entity           | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| **Organization** | Legal entity, structure, and top-level business context         |
| **Departments**  | Organizational units and reporting hierarchy                    |
| **Employees**    | People, roles, and assignments within the organization          |
| **Permissions**  | Business-level access rules bound to roles and entities         |
| **Customers**    | Client organizations and contacts the business serves           |
| **Suppliers**    | Vendors and partners the business procures from                 |
| **Products**     | Goods and offerings the business sells or delivers              |
| **Machines**     | Automated systems, bots, and integrations registered to the org |
| **Services**     | Service lines and deliverables the business provides            |
| **Projects**     | Initiatives with scope, ownership, and lifecycle                |
| **Assets**       | Physical and digital assets owned or managed by the org         |
| **Branches**     | Locations, subsidiaries, and regional units                     |
| **Workflows**    | Defined business processes and their stages                     |
| **Knowledge**    | Canonical business facts, SOPs, and reference material          |
| **AI Agents**    | Registered agents, their roles, and domain assignments          |
| **KPIs**         | Key performance indicators and measurement definitions          |
| **Goals**        | Strategic and operational targets                               |
| **Policies**     | Business rules, compliance requirements, and constraints        |
| **Integrations** | External systems connected to the organization                  |

## AI consumption model

All AI agents **consume** Business DNA. They do not create, duplicate, or override business entities.

- Agents resolve context (who, what, where) from Business DNA before acting
- Agents write changes back through Business DNA, not through local state
- Agent permissions are defined in Business DNA and enforced by Core authorization
- If an entity is not in Business DNA, it does not exist to the system

## Boundaries

Business DNA owns _the business model itself_. It does not own:

- Platform plumbing (core/) — identity verification, event delivery, file bytes
- Domain execution — marketing campaigns, sales pipelines, operational runs
- AI agent behavior — agent roles and execution (ai-workforce/)
- Historical event logs and derived indexes (memory/, audit/)

Other domains operate _on_ Business DNA data. Core provides _access to_ it. The AI Workforce acts _through_ it.
