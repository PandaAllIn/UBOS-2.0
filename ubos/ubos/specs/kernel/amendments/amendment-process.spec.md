---
version: 1.0.0
type: amendment-process
status: approved
author: UBOS Council
---

# UBOS Amendment Process Specification

## Metadata
```yaml
version: 1.0.0
type: amendment-process
status: approved
author: UBOS Council
backing_assets:
  rationale: "Defines governance checks/balances for constitutional changes"
```

## Process Overview

- Proposal status flow: draft → proposed → approved → executable
- Quorum requirement: 2-of-3 founding citizens for constitutional changes
- Attestation: Signed JSON record per amendment stored under `logs/governance/amendments/`
- Rollback: previous constitution versions must be resolvable via registry

## Acceptance Criteria
- [ ] Any spec with `type: constitution` changing `version` must create an attestation record
- [ ] Attestation has proposer, approvers, reason, and hash of the new spec content
- [ ] Registry updated with new version and timestamp
- [ ] Rollback possible by marking previous version as active

## Implementation Hooks

```afterInit typescript
// reserve: verify signatures for amendment attestations if provided
```

