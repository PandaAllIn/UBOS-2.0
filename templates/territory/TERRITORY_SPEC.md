---
version: 1.0.0
type: territory
status: draft
author: your-name
---

# {{TERRITORY_NAME}} Territory Specification

## Metadata
```yaml
version: 1.0.0
type: territory
status: draft
author: your-name
backing_assets:
  notes: initial draft
```

## Services
- service-one: 100 credits
- service-two: 250 credits

## Acceptance Criteria
- [ ] Services are parsed and exposed via territory loader
- [ ] Territory initializes without errors

## Implementation Hooks

```beforeInit typescript
// optional: code/expression executed before territory init
```

```afterInit typescript
// optional: code/expression executed after territory init
```

```onMetamorphosis typescript
// optional: code/expression executed on territory reload
```

