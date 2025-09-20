import { AgentSoul } from './memory/agentMemory';
import { UBOSKernel } from '../kernel/kernel';

export class AgentRegistrar {
  constructor(private kernel: UBOSKernel) {}

  async registerAgent(soul: AgentSoul): Promise<{ id: string; balance: number; level: number; registrationTx: string }> {
    // Map soul achievements to citizen state
    const id = soul.agentId;
    const balance = soul.achievements.xp;
    const level = soul.achievements.level;

    await this.kernel.registerCitizenRecord({ id, balance, level });

    const registrationTx = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Return a simple registration proof. Updater of soul is done by caller.
    return { id, balance, level, registrationTx };
  }
}

