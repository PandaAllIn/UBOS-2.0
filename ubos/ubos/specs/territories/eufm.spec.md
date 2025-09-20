---
version: 1.0.0
type: territory
status: proposed
author: EUFM Core
---

# EUFM Territory Specification

## User Stories

### User Story: EU Funding Discovery
As a business owner, I want to discover relevant EU funding opportunities
so that I can secure funding for my projects.

### User Story: Proposal Generation
As a grant writer, I want AI assistance in writing EU proposals
so that I can submit high-quality applications faster.

## Services
- eu-discovery: 100 credits
- proposal-writing: 1000 credits
- compliance-check: 500 credits

## Implementation
```typescript
class EUFMTerritory extends Territory {
  services = [
    { id: 'eu-discovery', price: 100 },
    { id: 'proposal-writing', price: 1000 }
  ];
}
```

