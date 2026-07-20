# Launch Product — Flow

## End-to-end flow

```
Trend Signal
     │
     ▼
Product Discovery Pipeline (7 stages)
     │
     ▼
PM Review ──► Capability Check ──► Profit Estimate
     │
     ├── Marketing Review ──┐
     ├── Finance Review ────┼──► Consensus
     └── Operations Review ─┘
                              │
                              ▼
                       Decision Engine
                              │
                              ▼
                        CEO Approval
                              │
                              ▼
                    Workflow Completed
                              │
                              ▼
                     Mission Outputs
```

## Platform integration

| Stage | Platform |
| ----- | -------- |
| Trend Detected | Product Discovery, Institutional Memory |
| Product Discovery | Product Discovery Service |
| PM Review | AI Workforce, AI Runtime |
| Capability Verification | Business DNA |
| Profit Estimation | Product Discovery |
| Marketing/Finance/Ops Review | AI Workforce |
| Consensus | Multi-Agent |
| Decision Engine | Decision Engine |
| CEO Approval | AI Workforce, Decision Engine |
| Workflow Completed | Workflow Engine, Institutional Memory |

## Rules

### Escalation
- Marketing/Finance/Operations review rejection → CEO AI
- Consensus deadlock → Decision Engine
- Decision Engine failure → Human operator

### Retry
- Trend Detected, Product Discovery, Capability Verification, Profit Estimation — up to 2 attempts

### Rollback
- CEO rejection → back to Consensus
- Decision Engine rejection → back to PM Review

## Events published

1. MissionStarted
2. MissionStageCompleted (per stage)
3. MissionEscalated (when triggered)
4. ConsensusReached
5. DecisionApproved
6. MissionCompleted
