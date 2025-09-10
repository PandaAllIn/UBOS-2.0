---
version: 1.0.0
type: governance
status: proposed
author: The Founding Trinity
---

# Intentocracy Governance Model

## Principles
- Votes are weighted by credits and contributions (level as proxy).
- Proposals are specs that can be tallied and enacted.
- Transparency: all proposals and votes are public in memory.

## Voting Weight (v1)
```
weight = credits + (level * 100)
```

## Quorum (v1)
- Any participation yields a valid outcome; future versions add dynamic quorum.

## CLI Interfaces
- proposal submit <title> [--desc text] [--proposer id]
- vote cast <citizenId> <proposalId> approve|reject|abstain
- governance tally <proposalId>

## Acceptance Criteria
- [ ] Citizens can submit proposals.
- [ ] Votes are recorded with weights.
- [ ] Tally determines approved/rejected.

