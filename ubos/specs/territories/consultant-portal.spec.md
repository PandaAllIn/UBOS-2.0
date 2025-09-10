---
version: 1.0.0
type: territory
status: approved
author: UBOS Core
---

# Consultant Portal Territory Specification

## Metadata
```yaml
version: 1.0.0
type: territory
status: approved
author: UBOS Core
backing_assets:
  rationale: "Public-facing SaaS for EUFM consultancy"
```

## Services
- pricing-insights: 50 credits
- opportunity-analysis: 200 credits
- document-upload: 10 credits
- results-report: 30 credits

## Acceptance Criteria
- [ ] Territory registers under id `consultant-portal`
- [ ] Services are exposed for pricing, analysis, upload, and reporting
- [ ] Initializes without errors and is observable in territory events log

## Implementation Hooks

```beforeInit typescript
// reserve: initialize pricing cache if needed
```

```afterInit typescript
// reserve: signal availability to monitoring
```

```onMetamorphosis typescript
// reserve: invalidate and rebuild any runtime caches
```

