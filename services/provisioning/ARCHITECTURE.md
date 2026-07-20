# Provisioning Architecture

## Principles

1. **Orchestration only** — no business logic
2. **17 provisioning steps** executed sequentially
3. **Profile-driven** — defaults per industry/business type
4. **BullMQ** for async job queuing (optional Redis)

## Provisioning Steps

Validate Request → Create Organization → Create Tenant → Create Identity → Create Administrator → Install Marketplace Extensions → Install Industry Pack → Create Business DNA → Create Departments → Create Roles → Create Permissions → Create AI Workforce → Create Workflows → Create Dashboards → Create KPIs → Run Health Checks → Generate Report

## Service Integration

| Step | Target Service |
| ---- | -------------- |
| Organization, DNA, Departments, KPIs | business-dna-service |
| Tenant, Identity, Roles, Permissions | identity-service |
| Extensions, Industry Pack | marketplace-service |
| AI Workforce | ai-workforce |
| Workflows | workflow-engine |
| Health Checks | kernel |

Steps use stub orchestrator ports in v1 — contracts ready for live service calls.
