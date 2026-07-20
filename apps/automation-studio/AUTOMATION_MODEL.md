# Automation Model

Design contracts for Automation Studio (`src/lib/types/automation.ts`).

## AutomationDesign

| Field | Type | Description |
| ----- | ---- | ----------- |
| id | string | Unique identifier |
| organizationId | string | Tenant scope |
| name | string | Display name |
| description | string | Summary |
| triggerType | TriggerType | Primary trigger |
| nodes | FlowNode[] | Canvas nodes |
| edges | FlowEdge[] | Canvas edges |
| variables | object[] | Template variables |
| schedule | string? | Cron expression |
| status | draft \| published \| archived | Lifecycle |
| version | number | Design version |

## Trigger Types (11)

manual · cron · webhook · business-event · marketplace-event · connector-event · threshold · timer · mission-completed · workflow-completed · decision-approved

## Action Types (14)

create-customer · create-project · create-quotation · create-order · launch-mission · run-workflow · run-ai-worker · approve-decision · reject-decision · send-email · send-notification · connector-sync · knowledge-import · marketplace-install

## ExecutionRecord

Tracks execution timeline with step status, retries, failures, duration, decision trace, and worker trace. Read-only in Studio — populated by Workflow Engine.

## Templates (8)

Sales Follow-up · Customer Onboarding · Product Launch · Procurement Approval · Invoice Reminder · Production Planning · Printing Workflow

## Lifecycle

`draft` → `published` → `archived`

Design versions are separate from execution instances.
