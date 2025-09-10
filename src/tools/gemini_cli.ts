#!/usr/bin/env node

import { geminiComplete } from '../adapters/google_gemini.js';
import * as fs from 'fs';
import * as path from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

export class GeminiCLI {
  private context: string[] = [];
  private workingDir: string = process.cwd();

  constructor() {
    // Check for API key
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

  async start() {
    const askQuestion = () => {
      rl.question('gemini> ', async (input) => {
        if (input.trim() === '') {
          askQuestion();
          return;
        }

        try {
          await this.processCommand(input.trim());
        } catch (error: any) {
          console.error('❌ Error:', error.message);
        }

        askQuestion();
      });
    };

    askQuestion();
  }

  private async processCommand(input: string) {
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
        this.listDirectory(args || '.');
        break;

      case '/read':
        if (args) {
          this.readFile(args);
        } else {
          console.log('Usage: /read <filename>');
        }
        break;

      case '/search':
        if (args) {
          this.searchFiles(args);
        } else {
          console.log('Usage: /search <pattern>');
        }
        break;

      case '/cd':
        if (args) {
          this.changeDirectory(args);
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

  private showHelp() {
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

💡 Features:
  • Big context window (1M+ tokens)
  • Online search capabilities
  • Code generation and analysis
  • Multi-turn conversations
  • File system integration

Example: "Explain how to optimize this React component for performance"
`);
  }

  private showContext() {
    if (this.context.length === 0) {
      console.log('📝 No conversation context yet');
    } else {
      console.log('📝 Context History:');
      this.context.forEach((item, index) => {
        console.log(`${index + 1}. ${item.slice(0, 100)}${item.length > 100 ? '...' : ''}`);
      });
    }
  }

  private listDirectory(dirPath: string) {
    try {
      const fullPath = path.resolve(this.workingDir, dirPath);
      const items = fs.readdirSync(fullPath);

      console.log(`📁 Contents of ${fullPath}:`);
      items.forEach(item => {
        const itemPath = path.join(fullPath, item);
        const stats = fs.statSync(itemPath);
        const type = stats.isDirectory() ? '📁' : '📄';
        console.log(`  ${type} ${item}`);
      });
    } catch (error: any) {
      console.error('❌ Error reading directory:', error.message);
    }
  }

  private readFile(filePath: string) {
    try {
      const fullPath = path.resolve(this.workingDir, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');

      console.log(`📄 Content of ${fullPath}:`);
      console.log('---');
      console.log(content);
      console.log('---');
    } catch (error: any) {
      console.error('❌ Error reading file:', error.message);
    }
  }

  private searchFiles(pattern: string) {
    // Simple file search implementation
    const searchRecursive = (dir: string, pattern: string): string[] => {
      const results: string[] = [];

      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stats = fs.statSync(fullPath);

          if (stats.isDirectory()) {
            results.push(...searchRecursive(fullPath, pattern));
          } else if (item.includes(pattern)) {
            results.push(fullPath);
          }
        }
      } catch (error: any) {
        // Skip directories we can't read
      }

      return results;
    };

    const results = searchRecursive(this.workingDir, pattern);

    if (results.length === 0) {
      console.log(`🔍 No files found matching "${pattern}"`);
    } else {
      console.log(`🔍 Found ${results.length} files matching "${pattern}":`);
      results.forEach(file => console.log(`  📄 ${file}`));
    }
  }

  private changeDirectory(dirPath: string) {
    try {
      const fullPath = path.resolve(this.workingDir, dirPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        this.workingDir = fullPath;
        console.log('📁 Changed to:', this.workingDir);
      } else {
        console.error('❌ Directory not found:', fullPath);
      }
    } catch (error: any) {
      console.error('❌ Error changing directory:', error.message);
    }
  }

  private async processPrompt(prompt: string) {
    console.log('🤖 Thinking...');

    try {
      // Add to context
      this.context.push(`User: ${prompt}`);

      // Keep context manageable (last 10 exchanges)
      if (this.context.length > 20) {
        this.context = this.context.slice(-20);
      }

      // Create enhanced prompt with context
      const contextStr = this.context.join('\n');
      const enhancedPrompt = `
You are Gemini 2.5 Flash CLI - an advanced AI assistant with:
- Big context window (1M+ tokens)
- Online search capabilities
- Code generation and analysis expertise
- File system integration
- Working directory: ${this.workingDir}

Conversation context:
${contextStr}

Current user request: ${prompt}

Please provide a helpful, detailed response. If this involves code, provide working examples. If this involves file operations, be specific about paths and commands.
`;

      const response = await geminiComplete(enhancedPrompt);

      // Add response to context
      this.context.push(`Gemini: ${response}`);

      console.log('💡 Response:');
      console.log(response);
      console.log('---');

    } catch (error: any) {
      console.error('❌ Gemini API Error:', error.message);
    }
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new GeminiCLI();
  cli.start().catch(error => {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  });
}
