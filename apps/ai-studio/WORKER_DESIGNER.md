# Worker Designer

The Worker Designer (`/workers/[id]`) is the primary configuration surface for AI Workers.

## Tabs

| Tab | Field | Type |
| --- | ----- | ---- |
| General | id, organizationId, status, version | read-only metadata |
| Role | role | string |
| Goal | goal | string |
| Instructions | instructions | string |
| Temperature | temperaturePolicy | number 0–1 |
| Reasoning | reasoningPolicy | standard \| deep \| fast |
| Memory Access | memoryAccess | working, institutional, knowledge |
| Business DNA | businessDnaAccess | boolean |
| Institutional | institutionalMemoryAccess | boolean |
| Knowledge | knowledgeAccess | boolean |
| Decision | decisionPolicy | auto \| human-in-loop \| decision-engine |
| Tools | toolPermissions | WorkerTool[] |
| Connectors | connectorPermissions | string[] |
| Runtime Limits | maxTokens, timeoutMs | object |
| Budget | maxCostUsd, dailyQuota | object |
| Retry | attempts, delayMs | object |
| Fallback | enabled, workerId | object |

## Contract

Defined in `src/lib/types/studio.ts` as `WorkerDesign`.

## Runtime Boundary

Saving a worker design updates the BFF stub only. Published workers are managed by **AI Workforce**; execution uses **AI Runtime**.

## Navigation

- **Prompt Studio** — `/prompt-studio?workerId=...`
- **Testing Sandbox** — `/testing?workerId=...`
