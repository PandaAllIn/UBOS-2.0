export class UBOSCredits {
  private balance = 100; // Starting credits
  private level = 1;
  private transactions: Array<{
    type: 'earn' | 'spend';
    amount: number;
    source?: string;
    purpose?: string;
    timestamp: number;
  }> = [];

  constructor(private citizenId: string, opts?: { balance?: number; transactions?: Array<{
    type: 'earn' | 'spend'; amount: number; source?: string; purpose?: string; timestamp: number;
  }> }) {
    if (opts?.balance !== undefined) this.balance = opts.balance;
    if (opts?.transactions) this.transactions = [...opts.transactions];
  }

  async earn(amount: number, source: string): Promise<number> {
    this.balance += amount;
    this.transactions.push({
      type: 'earn',
      amount,
      source,
      timestamp: Date.now(),
    });

    await this.checkLevelUp();
    console.log(`💰 Earned ${amount} credits from ${source}`);
    return this.balance;
  }

  async spend(amount: number, purpose: string): Promise<boolean> {
    if (this.balance < amount) {
      console.log('❌ Insufficient credits');
      return false;
    }

    this.balance -= amount;
    this.transactions.push({
      type: 'spend',
      amount,
      purpose,
      timestamp: Date.now(),
    });

    console.log(`💸 Spent ${amount} credits on ${purpose}`);
    return true;
  }

  private async checkLevelUp() {
    const levels = [0, 100, 500, 1000, 5000, 10000];
    const newLevel = levels.filter((l) => this.balance >= l).length;

    if (newLevel > this.level) {
      this.level = newLevel;
      console.log(`🎉 LEVEL UP! You are now Level ${this.level}`);
      await this.unlockPerks();
    }
  }

  private async unlockPerks() {
    const perks: Record<number, string> = {
      2: 'Access to Portal Oradea broadcasting',
      3: 'Priority agent processing',
      4: 'Territory creation rights',
      5: 'Governance voting power',
    };

    const perk = perks[this.level];
    if (perk) console.log(`🎁 Unlocked: ${perk}`);
  }

  getBalance(): number {
    return this.balance;
  }

  getTransactions() {
    return [...this.transactions];
  }
}
