/**
 * Fix Security Issues CLI
 * Uses CodeRabbit Pro API to fix the identified security issues
 */
import dotenv from 'dotenv';
import { runSecurityScan } from './securityFixer.js';

// Load environment variables from .env file
dotenv.config();

const CODERABBIT_API_KEY = process.env.CODERABBIT_API_KEY;

async function main() {
  console.log('🚀 UBOS Security Issue Fixer\n');
  console.log('Using CodeRabbit Pro API for intelligent security analysis...\n');

  if (!CODERABBIT_API_KEY) {
    console.error('❌ Error: CODERABBIT_API_KEY is not set.');
    console.error('Please add your CodeRabbit API key to a .env file in the root of the project.');
    process.exit(1);
  }

  try {
    await runSecurityScan(CODERABBIT_API_KEY);
  } catch (error) {
    console.error('❌ Failed to run security scan:', error);
    process.exit(1);
  }
}

// Run if called directly
if (typeof require !== 'undefined' && require.main === module) {
  void main();
}

export { main as fixSecurity };
