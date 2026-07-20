# Business DNA Schema

This folder is the **canonical Business DNA specification** for Lateen OS.

Each file defines one core entity: its purpose, responsibilities, attributes, relationships, lifecycle, events, and business rules. All domains, services, and AI agents must conform to these definitions.

## Entities

| Entity                            | Description                                            | Enrichment |
| --------------------------------- | ------------------------------------------------------ | ---------- |
| [Organization](./Organization.md) | Lateen — AI-first printing and manufacturing org       | v1         |
| [Branch](./Branch.md)             | Location, subsidiary, or regional unit                 | —          |
| [Department](./Department.md)     | Organizational unit and reporting hierarchy            | —          |
| [Employee](./Employee.md)         | Person employed by the organization                    | —          |
| [Role](./Role.md)                 | Named set of responsibilities and permissions          | —          |
| [Permission](./Permission.md)     | Granular access rule bound to roles or actors          | —          |
| [Customer](./Customer.md)         | B2B account with contracts and recurring orders        | v1         |
| [Supplier](./Supplier.md)         | Vendor or partner providing goods or services          | —          |
| [Product](./Product.md)           | Manufactured/printed offering with production metadata | v1         |
| [Service](./Service.md)           | Deliverable service offered by the organization        | —          |
| [Machine](./Machine.md)           | Print and manufacturing production equipment           | v1         |
| [Project](./Project.md)           | Signage, branding, construction, and rollout projects  | v1         |
| [Quotation](./Quotation.md)       | Commercial offer to a customer                         |
| [Order](./Order.md)               | Confirmed request for products or services             |
| [Invoice](./Invoice.md)           | Billing document for delivered goods or services       |
| [Asset](./Asset.md)               | Physical or digital resource owned by the org          |
| [Workflow](./Workflow.md)         | Defined business process and its stages                |
| [Policy](./Policy.md)             | Business rule, constraint, or compliance requirement   |
| [KPI](./KPI.md)                   | Key performance indicator and measurement definition   |
| [AI Agent](./AI-Agent.md)         | Registered AI worker with role and permissions         |

## Conventions

### Identifiers

Every entity carries a stable, globally unique `id` within the organization scope. Human-readable `code` fields are optional but recommended for reference in documents and workflows.

### Status fields

Lifecycle states are enumerated per entity. Transitions must follow the lifecycle defined in each entity's specification.

### Events

Events follow the pattern `{entity}.{action}` (e.g. `order.confirmed`). All state changes emit events through Core event bus for consumption by domains, Intelligence, and AI Workforce.

### Relationships

Relationships are directional. The owning entity is documented in each file; inverse references are noted where relevant.

## Version

| Version       | Scope                                                               | Status |
| ------------- | ------------------------------------------------------------------- | ------ |
| Schema 1.0    | All 20 entities — base specification                                | Active |
| Enrichment v1 | Organization, Machine, Product, Customer, Project — Lateen-specific | Active |

Schema version: **1.0** — aligned with Lateen OS Architecture v1.0 Locked.

Enrichment v1 models Lateen as an AI-first printing, manufacturing, and visual communications company operating across Saudi Arabia and the GCC.
