---
version: 1.0.0
type: act
status: proposed
author: citizen:ai:developer:001
---

# Identity Attestation & Session Persistence Act

## Purpose
Codify cryptographic attestation, session isolation, and semantic/fact memories for agents and citizens.

## Provisions
- Software attestation mandatory (platform, signature, codeIntegrity, expiry).
- Session isolation credentials per mission (token + expiry).
- Short-term and long-term memories must be persisted.
- Facts are TTL-managed; semantic memories are vector-searchable.

## Interfaces
```typescript
interface SoulAttestation {
  platformSignature: string;
  environmentProof: string;
  codeIntegrity: string;
  timestamp: number;
}
```

## Acceptance Criteria
- [ ] Agents can attest identity with a code hash.
- [ ] Sessions issue ephemeral credentials.
- [ ] Facts can be pruned by TTL.
- [ ] Semantic memory supports nearest-neighbor search.

