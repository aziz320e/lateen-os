# AI Workforce

The **AI Workforce** domain represents the organization's AI agents — digital workers that operate across business domains.

Each agent is registered in Business DNA, consumes Business DNA for context, receives intelligence from the Intelligence domain, and acts within permissions enforced by Core authorization. Agents do not maintain their own business model.

Every agent operates in two mandatory modes defined by the [Proactive AI](../../docs/architecture/lateen-os-v1.md#3-proactive-ai) architectural principle:

- **Reactive Mode** — responds to explicit user requests
- **Proactive Mode** — continuously monitors Business DNA, Institutional Memory, Intelligence, and operational metrics; generates recommendations, opportunities, risks, and optimization proposals

## Agents

| Agent                                       | Responsibility                                                      |
| ------------------------------------------- | ------------------------------------------------------------------- |
| [ceo-ai](./ceo-ai/)                         | Strategic oversight, cross-domain coordination, executive decisions |
| [marketing-ai](./marketing-ai/)             | Campaign planning, brand alignment, market communication            |
| [sales-ai](./sales-ai/)                     | Pipeline management, deal support, revenue optimization             |
| [operations-ai](./operations-ai/)           | Process execution, workflow coordination, operational efficiency    |
| [finance-ai](./finance-ai/)                 | Financial analysis, budgeting support, compliance monitoring        |
| [product-manager-ai](./product-manager-ai/) | Product roadmap, feature prioritization, lifecycle management       |
| [hr-ai](./hr-ai/)                           | Workforce planning, employee lifecycle, organizational health       |
| [rd-ai](./rd-ai/)                           | Research, innovation, technical feasibility assessment              |

## Boundaries

The AI Workforce owns _agent roles and responsibilities_. Intelligence provides analysis; Business DNA provides entities and policies; Institutional Memory provides historical context; Core provides platform access; business domains own execution outcomes.
