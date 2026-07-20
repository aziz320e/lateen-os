# Mission Builder

The Mission Builder (`/mission-builder`) designs mission configurations for the Mission Scheduler.

## Mission Steps

| Step | Description |
| ---- | ----------- |
| Define Objective | Mission goal and scope |
| Assign AI Worker | Worker binding (via AI Workforce) |
| Set Success Criteria | Completion conditions |
| Configure Deadline | Time constraints |
| Link Workflow | Associated workflow reference |

## Contract

Mission designs are configuration contracts. The Mission Scheduler owns execution, scheduling, and lifecycle.

## Boundaries

- No mission execution in Automation Studio
- Worker assignment references AI Workforce worker IDs
- Workflow links reference Workflow Engine definitions

## Templates

Mission templates are available via the Templates section (Production Planning, Customer Onboarding, etc.).
