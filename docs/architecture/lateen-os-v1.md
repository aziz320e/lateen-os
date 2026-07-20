# Lateen OS Architecture v1.0

> **Status: Locked**
>
> Lateen OS Architecture v1.0 is finalized. This document is the authoritative specification. Changes require a new architecture version (v1.1+).

This document defines the seven-layer architecture of Lateen OS. Each layer has a distinct responsibility and strict boundaries. Higher layers depend on lower layers; lower layers never depend on higher ones.

## Core architectural principles

These principles govern every layer, domain, and agent in Lateen OS.

### 1. Business DNA as single source of truth

The canonical business model lives in Business DNA. All layers read from it; none duplicate its entities. All AI agents consume Business DNA — they never maintain a parallel business model.

### 2. Layered dependency

Each layer may depend only on layers below it. Business DNA has no upstream dependencies. Infrastructure hosts all layers without containing business logic.

### 3. Proactive AI

Every AI agent in the AI Workforce operates in two modes. Both modes are mandatory — an agent that only reacts is incomplete.

#### Reactive Mode

- Responds to explicit user requests.
- Executes tasks, answers questions, and performs actions on demand.
- Triggered by human input, application events, or direct API invocation.

#### Proactive Mode

- Continuously monitors:
  - **Business DNA** — entities, KPIs, goals, policies, and workflows
  - **Institutional Memory** — historical records, decisions, and organizational context (`domains/memory/`)
  - **Intelligence** — trends, forecasts, insights, and recommendations
  - **Operational metrics** — live performance data from business domains
- Generates without being asked:
  - **Recommendations** — suggested actions aligned with role and permissions
  - **Opportunities** — growth, efficiency, and innovation signals
  - **Risks** — threats to KPIs, compliance, operations, or customers
  - **Optimization proposals** — process, pricing, resource, and workflow improvements

Proactive outputs are surfaced through Applications and Core notifications. They do not bypass authorization — every proactive action is gated by Business DNA permissions and Core authorization, same as reactive actions.

### 4. Intelligence informs; domains execute

Intelligence analyzes and discovers. AI Workforce agents recommend and coordinate. Business domains own execution and outcomes.

### 5. Agents consume; agents do not invent

AI agents read context from Business DNA, Institutional Memory, and Intelligence. They write changes back through Business DNA. If an entity is not in Business DNA, it does not exist to the system.

---

## Layer overview

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 7: Infrastructure                                     │
│  Cloud, containers, networking, deployment                   │
├─────────────────────────────────────────────────────────────┤
│  Layer 6: Applications                                       │
│  User-facing apps, dashboards, portals                       │
├─────────────────────────────────────────────────────────────┤
│  Layer 5: Business Domains                                   │
│  Marketing, sales, operations, finance, …                    │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: AI Workforce                                       │
│  CEO AI, Sales AI, Marketing AI, …                           │
│  (Reactive + Proactive modes)                                │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Intelligence                                       │
│  Trend discovery, forecasting, recommendations, …            │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Core Platform                                      │
│  Identity, auth, event bus, search, audit, …                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Business DNA                                       │
│  Single source of truth for the business model               │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Business DNA

**Location:** `domains/business-dna/`

The foundation of Lateen OS. Business DNA is the canonical business model — the single source of truth for every entity the organization operates on.

### Owns

Organization, departments, employees, permissions, customers, suppliers, products, machines, services, projects, assets, branches, workflows, knowledge, AI agents, KPIs, goals, policies, and integrations.

### Rules

- All other layers read from Business DNA; none duplicate its entities.
- All AI agents consume Business DNA — they never create a parallel business model.
- Changes to business entities flow through Business DNA.

---

## Layer 2: Core Platform

**Location:** `domains/core/`

Cross-cutting platform services that every layer depends on.

### Capabilities

Identity, authentication, authorization, event bus, configuration, notifications, search, audit, and files.

### Rules

- Core provides _how_ the system runs; Business DNA provides _what_ the business is.
- Authorization evaluates permissions defined in Business DNA.
- The event bus connects all layers without tight coupling.

---

## Layer 3: Intelligence

**Location:** `domains/intelligence/`

Analytical and discovery capabilities that transform data into insights.

### Capabilities

Trend discovery, market research, competitor intelligence, product discovery, machine discovery, pricing intelligence, customer insights, knowledge mining, forecasting, and recommendation engine.

### Rules

- Intelligence analyzes; it does not execute business actions.
- Inputs come from Business DNA, business domains, and external sources.
- Outputs feed the AI Workforce and human operators.

---

## Layer 4: AI Workforce

**Location:** `domains/ai-workforce/`

AI agents that act as digital workers across the organization. Every agent operates in **Reactive Mode** and **Proactive Mode** (see [Proactive AI](#3-proactive-ai)).

### Agents

CEO AI, Marketing AI, Sales AI, Operations AI, Finance AI, Product Manager AI, HR AI, and R&D AI.

### Rules

- Each agent is registered in Business DNA with a defined role and permissions.
- Agents consume Business DNA for context and Intelligence for insights.
- Agents operate proactively — continuously monitoring and generating recommendations, opportunities, risks, and optimization proposals.
- Agents recommend and coordinate; business domains execute outcomes.
- Core authorization gates every agent action, reactive or proactive.

---

## Layer 5: Business Domains

**Location:** `domains/` (marketing, sales, operations, finance, products, machines, projects, customers, memory)

Operational bounded contexts that run the business day to day.

### Domains

| Domain     | Focus                                                 |
| ---------- | ----------------------------------------------------- |
| marketing  | Brand, positioning, campaigns                         |
| sales      | Pipeline, deals, revenue                              |
| operations | Process execution, delivery                           |
| finance    | Budgets, accounting, reporting                        |
| products   | Product lifecycle                                     |
| machines   | Automation, integrations                              |
| projects   | Initiative delivery                                   |
| customers  | Customer relationships                                |
| memory     | Institutional Memory — historical records and context |

### Rules

- Business domains operate on Business DNA entities.
- They receive intelligence and agent support but own execution.
- They publish events through Core for other layers to consume.
- Institutional Memory (`memory/`) is a primary input to Proactive AI monitoring.

---

## Layer 6: Applications

**Location:** `apps/`

User-facing interfaces that expose Lateen OS to humans.

### Owns

Web portals, dashboards, mobile clients, admin consoles, and domain-specific UIs.

### Rules

- Applications are thin presentation layers; business logic lives in services and domains.
- Applications authenticate through Core and respect authorization boundaries.
- Each app maps to one or more business domains or AI Workforce agents.
- Applications surface proactive agent outputs — recommendations, opportunities, risks, and optimization proposals.

---

## Layer 7: Infrastructure

**Location:** `infrastructure/`, `docker/`, `.github/`

Deployment, provisioning, and operational infrastructure.

### Owns

Cloud resources, container orchestration, CI/CD pipelines, monitoring, and environment configuration.

### Rules

- Infrastructure supports all layers without containing business logic.
- Environment-specific settings are managed through Core configuration.
- Infrastructure is domain-agnostic.

---

## Data flow

```
External sources ──→ Intelligence ──→ AI Workforce ──→ Business Domains
                          ↑                ↑                  ↑
                     Business DNA ←── Core Platform ──────────┘
                          ↑                ↑
                   Institutional      Proactive monitoring
                     Memory         (continuous, all agents)
                          ↑
                     Applications (read/write via Core)
                          ↑
                     Infrastructure (hosts everything)
```

1. **Business DNA** defines the business model.
2. **Core** provides access, security, and messaging.
3. **Intelligence** analyzes data and produces insights.
4. **AI Workforce** agents act on insights within their roles — reactively and proactively.
5. **Business Domains** execute operational work.
6. **Applications** present the system to users.
7. **Infrastructure** hosts and deploys all layers.

---

## Dependency rules

| Layer            | May depend on                                  | Must not depend on                        |
| ---------------- | ---------------------------------------------- | ----------------------------------------- |
| Business DNA     | —                                              | All other layers                          |
| Core Platform    | Business DNA                                   | Intelligence, AI Workforce, domains, apps |
| Intelligence     | Business DNA, Core                             | AI Workforce, apps                        |
| AI Workforce     | Business DNA, Core, Intelligence               | Applications                              |
| Business Domains | Business DNA, Core, Intelligence, AI Workforce | Applications                              |
| Applications     | All layers below                               | —                                         |
| Infrastructure   | — (hosts all)                                  | Business logic                            |

---

## Monorepo mapping

| Layer            | Repository paths                         |
| ---------------- | ---------------------------------------- |
| Business DNA     | `domains/business-dna/`                  |
| Core Platform    | `domains/core/`                          |
| Intelligence     | `domains/intelligence/`                  |
| AI Workforce     | `domains/ai-workforce/`                  |
| Business Domains | `domains/{marketing,sales,…}/`           |
| Applications     | `apps/`                                  |
| Infrastructure   | `infrastructure/`, `docker/`, `.github/` |

Implementation code for domains lives in `packages/` (shared libraries) and `services/` (APIs and workers), mapped to the domain they serve.

---

## Version history

| Version | Status | Date       | Notes                                            |
| ------- | ------ | ---------- | ------------------------------------------------ |
| v1.0    | Locked | 2026-07-18 | Seven-layer architecture, Proactive AI principle |

**Lateen OS Architecture v1.0 Locked**
