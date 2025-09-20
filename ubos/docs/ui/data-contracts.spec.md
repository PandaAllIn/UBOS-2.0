---
version: 1.0.0
type: ui-data
status: proposed
author: UBOS Design
---

# UI Data Contracts — Spec

## Status
GET /api/status
```
{
  "timestamp": "ISO",
  "system": {
    "agents": { "active": 0, "completed": 0, "failed": 0 },
    "memory": { "notes": 0, "sizeKB": 0 },
    "costs": { "totalUSD": 0, "todayUSD": 0 }
  },
  "eufmProject": {
    "phase": "string",
    "progress": 0,
    "fundingOpportunities": 0
  },
  "alerts": [ { "level": "info", "message": "", "timestamp": "ISO" } ]
}
```

## Alerts
GET /api/alerts → Array<{ level, message, timestamp }>

## Opportunities
GET /api/opportunities → Array<{ id, title, program, deadline, budget, relevanceScore, status, url }>

## Tools
GET /api/tools → Array<{ id, name, status, notes? }>

## Subscriptions
GET /api/subscriptions → Array<{ provider, plan, status, cost }>

## Acceptance Criteria
- [ ] UI tolerates missing optional fields (defensive rendering).
- [ ] Types are documented and used in API client.
- [ ] Requests time out gracefully and show Offline pill.

