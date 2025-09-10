import { promises as fs } from 'fs';
import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { sendTriMessage, readAllMessages, runBridgeOnce, TriMessage } from './triChat.js';

interface ChatUI {
  messages: TriMessage[];
  rl: any;
  isWatching: boolean;
  lastDisplayed: number;
}

export class TriPartyChatUI {
  private ui: ChatUI;
  private bridgeProcess?: any;

  constructor() {
    this.ui = {
      messages: [],
      rl: createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: ''
      }),
      isWatching: false,
      lastDisplayed: 0
    };
  }

  private formatMessage(msg: TriMessage): string {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const fromColor = msg.from === 'human' ? '\x1b[36m' : msg.from === 'gpt5' ? '\x1b[35m' : '\x1b[32m';
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    
    let arrow = '→';
    if (msg.to === 'all') arrow = '⟶';
    if (msg.repliedToId) arrow = '↩️';
    
    return `${time} ${fromColor}${bold}${msg.from}${reset} ${arrow} ${msg.to === 'all' ? 'everyone' : msg.to}: ${msg.text}`;
  }

  private clearScreen() {
    console.clear();
    console.log('\x1b[1m\x1b[34m╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                          🚀 EUFM Tri-Party Chat                             ║');
    console.log('║                     Human ↔ GPT-5 ↔ Claude Collaboration                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m\n');
  }

  private async displayMessages() {
    this.ui.messages = await readAllMessages();
    const newMessages = this.ui.messages.slice(this.ui.lastDisplayed);
    
    if (newMessages.length > 0) {
      newMessages.forEach(msg => {
        console.log(this.formatMessage(msg));
      });
      this.ui.lastDisplayed = this.ui.messages.length;
      this.showPrompt();
    }
  }

  private showPrompt() {
    process.stdout.write('\n\x1b[36m\x1b[1mYou\x1b[0m: ');
  }

  private async startBackgroundBridge() {
    // Immediate bridge processing every 2 seconds
    setInterval(async () => {
      try {
        const { processed } = await runBridgeOnce({ lookback: 20 });
        if (processed > 0) {
          await this.displayMessages();
        }
      } catch (error: any) {
        // Silent - don't spam errors in chat UI
      }
    }, 2000);
  }

  private setupInput() {
    this.ui.rl.on('line', async (input: string) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        this.showPrompt();
        return;
      }

      // Handle special commands
      if (trimmed === '/exit' || trimmed === '/quit') {
        console.log('\n👋 Goodbye! Chat saved to logs/tri_chat/tri_chat.jsonl');
        process.exit(0);
      }

      if (trimmed === '/clear') {
        this.clearScreen();
        await this.displayMessages();
        return;
      }

      if (trimmed === '/help') {
        console.log('\n\x1b[33m📖 Commands:');
        console.log('  Type naturally to send to everyone');
        console.log('  @claude <message> - Send to Claude only');
        console.log('  @gpt5 <message> - Send to GPT-5 only');
        console.log('  /clear - Clear screen');
        console.log('  /exit - Quit chat\x1b[0m');
        this.showPrompt();
        return;
      }

      // Parse @mentions
      let to: 'claude' | 'gpt5' | 'all' = 'all';
      let message = trimmed;

      if (trimmed.startsWith('@claude ')) {
        to = 'claude';
        message = trimmed.substring(8);
      } else if (trimmed.startsWith('@gpt5 ')) {
        to = 'gpt5';
        message = trimmed.substring(6);
      }

      if (!message.trim()) {
        console.log('\x1b[31m❌ Empty message\x1b[0m');
        this.showPrompt();
        return;
      }

      // Send message
      try {
        await sendTriMessage('human', to, message);
        
        // Show the sent message immediately
        const sentMsg: TriMessage = {
          id: 'temp',
          timestamp: new Date().toISOString(),
          from: 'human',
          to,
          text: message
        };
        console.log(this.formatMessage(sentMsg));
        
        // Trigger immediate bridge processing for faster responses
        setTimeout(async () => {
          try {
            const { processed } = await runBridgeOnce({ lookback: 20 });
            if (processed > 0) {
              await this.displayMessages();
            }
          } catch (error: any) {
            // Silent
          }
        }, 500);
        
      } catch (error: any) {
        console.log(`\x1b[31m❌ Error: ${error.message}\x1b[0m`);
      }
      
      this.showPrompt();
    });
  }

  async start() {
    this.clearScreen();
    
    console.log('\x1b[33m💡 Welcome to the tri-party chat!');
    console.log('   • Type naturally to send to everyone');
    console.log('   • Use @claude or @gpt5 to send to specific AIs');
    console.log('   • Type /help for commands, /exit to quit');
    console.log('   • Responses appear automatically\x1b[0m\n');

    // Load and display existing messages
    await this.displayMessages();
    
    // Start background processing
    await this.startBackgroundBridge();
    
    // Setup input handling
    this.setupInput();
    
    this.showPrompt();
  }
}

// CLI wrapper
export async function startTriChatUI() {
  const chatUI = new TriPartyChatUI();
  await chatUI.start();
}