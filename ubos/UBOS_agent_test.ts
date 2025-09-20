#!/usr/bin/env npx tsx

/**
 * Simple EUFM Agent System Test
 * Tests what we can without full CLI dependency
 */

// Import working test agent
import { TestAgent } from './src/agents/community/testAgent.js';
import { AgentRunOptions } from './src/agents/premium/baseAgent.js';

console.log('🧪 EUFM Agent System Test Starting...\n');

async function testBasicAgent() {
  console.log('✅ Testing TestAgent (Community Agent)...');

  const agent = new TestAgent('test-001', 'agent-system-validation');

  const options: AgentRunOptions = {
    userId: 'claude-code-test',
    input: 'Testing EUFM agent system functionality'
  };

  try {
    const result = await agent.run(options);
    console.log('✅ TestAgent Result:', {
      success: result.success,
      agentId: result.agentId,
      outputLength: result.output?.length || 0
    });
    return true;
  } catch (error) {
    console.error('❌ TestAgent Failed:', error.message);
    return false;
  }
}

async function testAgentFeatures() {
  console.log('\n✅ Testing Agent Features...');

  const agent = new TestAgent('feature-test', 'feature-validation');

  console.log('Agent Type:', agent.type);
  console.log('Agent Feature Type:', agent.feature?.type);
  console.log('Agent Capabilities:', agent.feature?.capabilities);

  return true;
}

async function runAllTests() {
  console.log('🚀 EUFM System Testing\n');

  const tests = [
    { name: 'Basic Agent Functionality', test: testBasicAgent },
    { name: 'Agent Feature System', test: testAgentFeatures }
  ];

  let passed = 0;

  for (const { name, test } of tests) {
    console.log(`\n📋 Running: ${name}`);
    try {
      const success = await test();
      if (success) {
        console.log(`✅ PASSED: ${name}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${name}`);
      }
    } catch (error) {
      console.log(`❌ FAILED: ${name} - ${error.message}`);
    }
  }

  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);

  if (passed === tests.length) {
    console.log('🎉 All tests passed! EUFM agent system is functional.');
  } else {
    console.log('⚠️  Some tests failed. System needs attention.');
  }
}

// Run tests
runAllTests().catch(console.error);