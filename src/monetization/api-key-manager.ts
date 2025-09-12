import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface APIKey {
  id: string;
  key: string;
  customerId: string;
  name: string;
  created: number;
  lastUsed?: number;
  active: boolean;
  permissions: string[];
}

export class APIKeyManager {
  private keysFile = path.join(process.cwd(), 'logs', 'api-keys.json');
  private keyMap: Map<string, APIKey> = new Map();
  private initialized = false;

  constructor() {
    // Constructor is now synchronous
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.loadKeysFromFile();
      this.initialized = true;
    }
  }

  async createKey(customerId: string, name: string = 'API Key'): Promise<APIKey> {
    await this.initialize(); // Ensure initialization
    
    const actionId = await agentActionLogger.startWork(
      'APIKeyManager',
      'Create API key',
      `Creating API key for customer ${customerId}`,
      'system'
    );

    try {
      const key = this.generateSecureKey();
      const apiKey: APIKey = {
        id: this.generateId(),
        key,
        customerId,
        name,
        created: Date.now(),
        active: true,
        permissions: ['read', 'write']
      };

      this.keyMap.set(key, apiKey);
      await this.saveKeysToFile();

      await agentActionLogger.completeWork(
        actionId,
        `API key created: ${apiKey.id}`,
        [this.keysFile]
      );

      return apiKey;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to create API key: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async validateKey(apiKey: string): Promise<APIKey | null> {
    await this.initialize();
    const key = this.keyMap.get(apiKey);
    if (!key || !key.active) {
      return null;
    }

    // OPTIMIZATION: In a high-traffic system, writing to the file on every
    // validation is a major bottleneck. We update the timestamp in memory only.
    // A separate mechanism should be used to persist this data periodically.
    key.lastUsed = Date.now();

    return key;
  }

  async revokeKey(keyId: string, customerId: string): Promise<boolean> {
    await this.initialize();
    const actionId = await agentActionLogger.startWork(
      'APIKeyManager',
      'Revoke API key',
      `Revoking API key ${keyId} for customer ${customerId}`,
      'system'
    );

    try {
      let revoked = false;
      for (const [, keyData] of this.keyMap.entries()) {
        if (keyData.id === keyId && keyData.customerId === customerId) {
          keyData.active = false;
          revoked = true;
          break;
        }
      }

      if (revoked) {
        await this.saveKeysToFile();
        await agentActionLogger.completeWork(
          actionId,
          `API key revoked: ${keyId}`,
          [this.keysFile]
        );
      } else {
        await agentActionLogger.completeWork(
          actionId,
          `API key not found: ${keyId}`,
          []
        );
      }

      return revoked;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to revoke API key: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  async getKeysByCustomer(customerId: string): Promise<APIKey[]> {
    await this.initialize();
    const customerKeys: APIKey[] = [];
    for (const keyData of this.keyMap.values()) {
      if (keyData.customerId === customerId) {
        customerKeys.push(keyData);
      }
    }
    return customerKeys;
  }

  async getCustomerFromKey(apiKey: string): Promise<string | null> {
    await this.initialize();
    const key = this.keyMap.get(apiKey);
    return key && key.active ? key.customerId : null;
  }

  async regenerateKey(keyId: string, customerId: string): Promise<APIKey | null> {
    await this.initialize();
    const actionId = await agentActionLogger.startWork(
      'APIKeyManager',
      'Regenerate API key',
      `Regenerating API key ${keyId} for customer ${customerId}`,
      'system'
    );

    try {
      let existingKey: APIKey | null = null;

      for (const [oldKey, keyData] of this.keyMap.entries()) {
        if (keyData.id === keyId && keyData.customerId === customerId) {
          existingKey = keyData;
          this.keyMap.delete(oldKey);
          break;
        }
      }

      if (existingKey) {
        const newKey = this.generateSecureKey();
        const regenerated: APIKey = {
          ...existingKey,
          key: newKey,
          created: Date.now()
        };

        this.keyMap.set(newKey, regenerated);
        await this.saveKeysToFile();

        await agentActionLogger.completeWork(
          actionId,
          `API key regenerated: ${keyId}`,
          [this.keysFile]
        );

        return regenerated;
      }

      await agentActionLogger.completeWork(
        actionId,
        `API key not found: ${keyId}`,
        []
      );

      return null;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to regenerate API key: ${error instanceof Error ? error.message : String(error)}`,
        []
      );
      throw error;
    }
  }

  private generateSecureKey(): string {
    return 'sk-' + crypto.randomBytes(32).toString('hex');
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async loadKeysFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.keysFile, 'utf8');
      const keys: APIKey[] = JSON.parse(data);
      this.keyMap.clear();
      for (const key of keys) {
        this.keyMap.set(key.key, key);
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error('Failed to load API keys from file:', error);
      }
      // File doesn't exist, start with empty map
    }
  }

  private async saveKeysToFile(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.keysFile), { recursive: true });
      const keys = Array.from(this.keyMap.values());
      await fs.writeFile(this.keysFile, JSON.stringify(keys, null, 2));
    } catch (error) {
      console.error('Failed to save API keys to file:', error);
      throw error;
    }
  }
}

export const apiKeyManager = new APIKeyManager();
