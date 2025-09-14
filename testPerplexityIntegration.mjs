/**
 * Test Perplexity Integration for Claude-Modular Research
 */

// Use native fetch in Node.js 18+

const PERPLEXITY_API_KEY = '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';
const endpoint = 'https://api.perplexity.ai/chat/completions';

async function testPerplexityResearch() {
  console.log('🔬 Testing Perplexity Sonar Integration for Claude-Modular Research');
  
  const query = `
Research the claude-modular framework comprehensively. Focus on:

1. Core architecture and design patterns
2. Token optimization techniques and strategies
3. Command structures and API design
4. Security implementation patterns
5. Performance characteristics and benchmarks
6. Integration strategies with existing systems
7. Best practices and optimization principles
8. Community adoption and real-world use cases

Provide detailed technical information, implementation examples, and actionable insights.
`;

  const requestBody = {
    model: 'sonar-reasoning',
    messages: [
      { 
        role: 'system', 
        content: `You are an expert technical researcher specializing in AI frameworks and modular architectures. Conduct comprehensive research with:
        
- Deep technical analysis
- Specific implementation details
- Performance metrics and benchmarks
- Real-world usage examples
- Security considerations
- Integration patterns
- Best practices and optimization techniques

Provide structured, actionable insights with clear source attribution.`
      },
      { 
        role: 'user', 
        content: query
      }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    top_p: 0.9
  };

  try {
    console.log('📡 Sending research request to Perplexity Sonar...');
    const startTime = Date.now();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const usage = data?.usage;
    const processingTime = Date.now() - startTime;

    console.log('✅ RESEARCH COMPLETED');
    console.log(`⏱️  Processing Time: ${processingTime}ms`);
    console.log(`🎯 Tokens Used: ${usage?.total_tokens || 'N/A'}`);
    console.log('\n📋 RESEARCH RESULTS:');
    console.log('='.repeat(80));
    console.log(content);
    console.log('='.repeat(80));

    // Estimate cost
    const tokensUsed = usage?.total_tokens || 2000;
    const estimatedCost = (tokensUsed * 0.002) / 1000; // Approximate pricing
    console.log(`\n💰 Estimated Cost: $${estimatedCost.toFixed(4)}`);
    
    return {
      success: true,
      content,
      usage,
      processingTime,
      estimatedCost
    };

  } catch (error) {
    console.error('❌ RESEARCH FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute research
testPerplexityResearch()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 PERPLEXITY INTEGRATION TEST SUCCESSFUL');
      console.log('✅ Ready for full Research Agent deployment');
    } else {
      console.log('\n❌ INTEGRATION TEST FAILED');
      console.error(result.error);
    }
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
  });