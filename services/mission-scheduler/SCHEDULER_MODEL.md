# Scheduler Model

## Scheduling modes

| Mode | Description |
| ---- | ----------- |
| IMMEDIATE | Enqueue now |
| DELAYED | Delay N seconds |
| CRON | Next run from cron expression |
| RECURRING | Recurring cron schedule |
| BUSINESS_CALENDAR | Respect working hours + holidays |

## Mission lifecycle

```
PENDING → SCHEDULED → RUNNING → COMPLETED
                         ↓
                    FAILED → RETRYING → DEAD_LETTER
                         ↓
                    CANCELLED / EXPIRED
```

## Mission sources

Business Events, Workflow Events, Decision Events, Intelligence Signals, Institutional Memory, Calendar Triggers, Cron Schedules, Connector Webhooks, System Health Events, Manual.

## Trigger types

Manual, Cron, Business Event, Webhook, Decision Approved, Workflow Completed, Connector Sync, Threshold Exceeded.

## Queue

- **BullMQ** with priority (LOW, NORMAL, HIGH, CRITICAL)
- Retry up to `MAX_RETRY_ATTEMPTS` (default 3)
- Dead letter on exhaustion
- In-memory fallback in test mode

## SLA

Default SLA deadline: `DEFAULT_SLA_MINUTES` (60) from scheduled time. Monitoring reports `slaBreaches`.

## Timezone

Default: `Asia/Riyadh`. Calendar rules define working days (Sun–Thu), hours, and holidays.

## API flow

```http
POST /api/missions
{ "missionType": "LAUNCH_PRODUCT", "mode": "IMMEDIATE" }

POST /api/missions/{id}/execute
```

Execution dispatches to the target service defined in the mission type catalog (e.g. AI Product Manager for Launch Product).
