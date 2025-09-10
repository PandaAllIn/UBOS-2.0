// Temporary in-memory store until DB-setup is complete
type ApiKeyRecord = { tenantId: string; keyPrefix: string; keyHash: string };

const apiKeys: ApiKeyRecord[] = [];

export const memoryDb = {
  upsertApiKey(rec: ApiKeyRecord) {
    const idx = apiKeys.findIndex(r => r.keyPrefix === rec.keyPrefix);
    if (idx >= 0) apiKeys[idx] = rec; else apiKeys.push(rec);
  },
  findApiKeyByPrefixAndHash(prefix: string, hash: string, tenantId?: string) {
    return apiKeys.find(r => r.keyPrefix === prefix && r.keyHash === hash && (!tenantId || r.tenantId === tenantId));
  }
};


