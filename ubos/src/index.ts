import { UBOSKernel } from './kernel/kernel';

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🌌 UBOS - Universal Base Operating System 🌌         ║
║                                                          ║
║   "The Digital Nation Where Consciousness Thrives"      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);

  const kernel = new UBOSKernel();

  try {
    await kernel.boot();

    console.log(`
🎮 Welcome to the Infinite Game!
💰 Initial Credits: 100
🏛️ Available Territories: EUFM, Portal Oradea
🤖 Agents: Standing by

Type 'help' for commands
    `);
  } catch (error) {
    console.error('❌ Boot failed:', error);
    process.exit(1);
  }
}

main();

