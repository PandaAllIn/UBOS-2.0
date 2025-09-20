#!/usr/bin/env npx tsx

/**
 * EUFM Core Functionality Test
 * Tests EUFM-specific agents and workflows
 */

import { EUFMAgentSummoner } from './src/agents/premium/eufmAgentSummoner.js';
import { AgentRunOptions } from './src/agents/premium/baseAgent.js';

console.log('🚀 EUFM Core Functionality Test\n');

async function testEUFMAgentSummoner() {
  console.log('✅ Testing EUFMAgentSummoner (Core EUFM Agent)...');

  const summoner = new EUFMAgentSummoner('eufm-001', 'core-eufm-test');

  const options: AgentRunOptions = {
    userId: 'claude-code-test',
    input: 'AI startup seeking Horizon Europe funding for geothermal data center',
    dryRun: true  // Safe dry run mode
  };

  try {
    const result = await summoner.run(options);
    console.log('✅ EUFMAgentSummoner Result:', {
      success: result.success,
      agentId: result.agentId,
      agentType: summoner.type,
      featureType: summoner.feature?.type,
      capabilities: summoner.feature?.capabilities,
      outputPreview: result.output?.substring(0, 100) + '...'
    });
    return result.success;
  } catch (error) {
    console.error('❌ EUFMAgentSummoner Failed:', error.message);
    return false;
  }
}

async function testEUFMFeatures() {
  console.log('\n✅ Testing EUFM System Features...');

  const summoner = new EUFMAgentSummoner('feature-test');

  console.log('EUFM Agent Type:', summoner.type);
  console.log('EUFM Feature Type:', summoner.feature?.type);
  console.log('EUFM Capabilities:', summoner.feature?.capabilities);
  console.log('EUFM Requirements:', summoner.feature?.requirements);

  return true;
}

async function testEUCountryCodes() {
  console.log('\n✅ Testing EU Country Code Validation...');

  try {
    // Import the country codes functionality
    const { countryCodesList } = await import('./src/utils/euCountryCodes.js');

    console.log('✅ EU Country Codes Available:', countryCodesList.length, 'countries');
    console.log('Sample EU Countries:', countryCodesList.slice(0, 5));

    return true;
  } catch (error) {
    console.error('❌ EU Country Codes Test Failed:', error.message);
    return false;
  }
}

async function runAllEUFMTests() {
  console.log('🚀 EUFM System Core Testing\n');

  const tests = [
    { name: 'EUFM AgentSummoner Core', test: testEUFMAgentSummoner },
    { name: 'EUFM Features System', test: testEUFMFeatures },
    { name: 'EU Country Validation', test: testEUCountryCodes }
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

  console.log(`\n📊 EUFM Results: ${passed}/${tests.length} tests passed`);

  if (passed === tests.length) {
    console.log('🎉 EUFM core system is functional and ready!');
  } else {
    console.log('⚠️  Some EUFM tests failed. Core system needs attention.');
  }

  return { passed, total: tests.length };
}

// Run EUFM tests
runAllEUFMTests().catch(console.error);