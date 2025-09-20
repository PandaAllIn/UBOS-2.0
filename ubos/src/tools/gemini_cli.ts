#!/usr/bin/env node

import { createInterface } from 'readline';
import { promises as fs } from 'fs';
import path from 'path';
import { geminiComplete } from '../adapters/google_gemini.js';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

export class GeminiCLI {
  private context: string[] = [];
  private workingDir: string = process.cwd();

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Missing GEMINI_API_KEY environment variable');
      console.log('Set it with: export GEMINI_API_KEY=your_key_here');
      process.exit(1);
    }

    console.log('🚀 Gemini 2.5 Flash CLI - Interactive Mode');
    console.log('💡 Commands: /help, /context, /clear, /pwd, /ls, /read <file>, /search <pattern>');
    console.log('📝 Just type your prompt for AI responses');
    console.log('---');
  }

  async start(): Promise<void> {
    const askQuestion = () => {
      rl.question('gemini> ', async (input) => {
        if (input.trim() === '') {
          askQuestion();
          return;
        }

        try {
          await this.processCommand(input.trim());
        } catch (error: unknown) {
          console.error('❌ Error:', (error as Error).message);
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  private async processCommand(input: string): Promise<void> {
    const command = input.split(' ')[0];
    const args = input.slice(command.length).trim();

    switch (command) {
      case '/help':
        this.showHelp();
        break;
      case '/context':
        this.showContext();
        break;
      case '/clear':
        this.context = [];
        console.log('🧹 Context cleared');
        break;
      case '/pwd':
        console.log('📁', this.workingDir);
        break;
      case '/ls':
        await this.listDirectory(args || '.');
        break;
      case '/read':
        if (args) {
          await this.readFile(args);
        } else {
          console.log('Usage: /read <filename>');
        }
        break;
      case '/search':
        if (args) {
          await this.searchFiles(args);
        } else {
          console.log('Usage: /search <pattern>');
        }
        break;
      case '/cd':
        if (args) {
          await this.changeDirectory(args);
        } else {
          console.log('Usage: /cd <directory>');
        }
        break;
      case '/exit':
      case '/quit':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        await this.processPrompt(input);
        break;
    }
  }

  private showHelp(): void {
    console.log(`
🤖 Gemini 2.5 Flash CLI Commands:

📝 AI Interaction:
  <any text>          - Send prompt to Gemini 2.5 Flash
  /help               - Show this help
  /context            - Show current conversation context
  /clear              - Clear conversation context

📁 File Operations:
  /pwd                - Show current working directory
  /ls [path]          - List directory contents
  /cd <path>          - Change directory
  /read <file>        - Read and display file content
  /search <pattern>   - Search for files matching pattern

🔧 System:
  /exit or /quit      - Exit CLI
`);
  }

  private showContext(): void {
    if (!this.context.length) {
      console.log('📭 Context is empty.');
      return;
    }
    console.log('🧠 Conversation context:');
    for (const entry of this.context.slice(-10)) {
      console.log(`  ${entry}`);
    }
  }

  private async listDirectory(target: string): Promise<void> {
    const resolved = path.resolve(this.workingDir, target);
    try {
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      for (const entry of entries) {
        console.log(entry.isDirectory() ? `📁 ${entry.name}/` : `📄 ${entry.name}`);
      }
    } catch (error: unknown) {
      console.error('❌ Unable to list directory:', (error as Error).message);
    }
  }

  private async readFile(target: string): Promise<void> {
    const resolved = path.resolve(this.workingDir, target);
    try {
      const data = await fs.readFile(resolved, 'utf-8');
      console.log(`
📄 ${path.relative(this.workingDir, resolved)}
${'-'.repeat(40)}
${data}
`);
    } catch (error: unknown) {
      console.error('❌ Unable to read file:', (error as Error).message);
    }
  }

  private async searchFiles(pattern: string): Promise<void> {
    const resolved = path.resolve(this.workingDir);
    const regex = new RegExp(pattern, 'i');
    const results: string[] = [];

    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (regex.test(entry.name)) {
          results.push(path.relative(this.workingDir, fullPath));
          if (results.length >= 50) return;
        }
      }
    };

    try {
      await walk(resolved);
      if (!results.length) {
        console.log('🔍 No matches found.');
        return;
      }
      console.log('🔍 Matches:');
      results.forEach((file) => console.log(`  ${file}`));
    } catch (error: unknown) {
      console.error('❌ Search failed:', (error as Error).message);
    }
  }

  private async changeDirectory(target: string): Promise<void> {
    const resolved = path.resolve(this.workingDir, target);
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) throw new Error('Target is not a directory');
      this.workingDir = resolved;
      console.log('📁 Working directory:', this.workingDir);
    } catch (error: unknown) {
      console.error('❌ Unable to change directory:', (error as Error).message);
    }
  }

  private trimContext(): void {
    const MAX_ENTRIES = 20;
    if (this.context.length > MAX_ENTRIES) {
      this.context.splice(0, this.context.length - MAX_ENTRIES);
    }
  }

  private async processPrompt(input: string): Promise<void> {
    this.context.push(`User: ${input}`);
    this.trimContext();

    const prompt = this.context.join('\n');
    try {
      const response = await geminiComplete(prompt, 'gemini-2.0-flash');
      const cleaned = response?.trim() || '[No response]';
      console.log(`
🤖 Gemini:
${cleaned}
`);
      this.context.push(`Gemini: ${cleaned}`);
      this.trimContext();
    } catch (error: unknown) {
      console.error('❌ Gemini request failed:', (error as Error).message);
    }
  }
}

if (require.main === module) {
  const cli = new GeminiCLI();
  cli.start();
}
