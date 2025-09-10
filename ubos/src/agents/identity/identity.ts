export interface SoulAttestation {
  platformSignature: string; // e.g., software-enforced signature
  environmentProof: string; // hostname, platform, runtime
  codeIntegrity: string; // hash of relevant code files
  timestamp: number;
}

export interface UBOSIdentity {
  soulId: string; // agentId
  citizenId: string; // mirrors soulId when registered
  attestation: {
    platform: string; // 'cursor', 'abacus', 'local'
    signature: string; // signature string
    timestamp: number;
    expiry: number;
  };
  memory: {
    shortTerm: Record<string, any>;
    // vector and facts are managed by dedicated services
  };
  sandbox: {
    allowedTerritories: string[];
    maxCredits: number;
    permissions: string[];
    isolationLevel: 'session' | 'user' | 'global';
  };
}

