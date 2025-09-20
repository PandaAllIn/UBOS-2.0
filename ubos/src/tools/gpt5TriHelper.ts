#!/usr/bin/env node

/**
 * GPT-5 Tri-Chat Helper
 * 
 * This script makes it super easy for GPT-5 to send messages to the tri-party chat.
 * GPT-5 just needs to run this script with their message as arguments.
 * 
 * Usage examples:
 * node gpt5TriHelper.js "Hello everyone, this is GPT-5"
 * node gpt5TriHelper.js @claude "Claude, let's work on the dashboard"
 * node gpt5TriHelper.js @human "Human, what do you think about this idea?"
 */

import { sendTriMessage } from './triChat.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('GPT-5 Tri-Chat Helper');
    console.log('Usage:');
    console.log('  node gpt5TriHelper.js "message to everyone"');
    console.log('  node gpt5TriHelper.js @claude "message to Claude"');
    console.log('  node gpt5TriHelper.js @human "message to Human"');
    process.exit(1);
  }

  const fullMessage = args.join(' ');
  let to: 'claude' | 'human' | 'all' = 'all';
  let message = fullMessage;

  // Parse @mentions
  if (fullMessage.startsWith('@claude ')) {
    to = 'claude';
    message = fullMessage.substring(8);
  } else if (fullMessage.startsWith('@human ')) {
    to = 'human';
    message = fullMessage.substring(7);
  }

  try {
    await sendTriMessage('gpt5', to, message);
    console.log(`✅ Message sent to ${to === 'all' ? 'everyone' : to}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
  } catch (error: unknown) {
    console.error(`❌ Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main().catch(console.error);