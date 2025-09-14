/**
 * Follow-up Research on Claude-Modular Framework
 * Token Optimization and Command Structures
 */

const PERPLEXITY_API_KEY = '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';
const endpoint = 'https://api.perplexity.ai/chat/completions';

async function conductFollowUpResearch(query, title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(60));
  
  const requestBody = {
    model: 'sonar-reasoning',
    messages: [
      { 
        role: 'system', 
        content: `You are a technical expert specializing in AI framework optimization and modular architectures. Provide detailed, actionable technical insights with specific implementation examples and best practices.`
      },
      { 
        role: 'user', 
        content: query
      }
    ],
    temperature: 0.1,
    max_tokens: 3000,
    top_p: 0.9
  };

  try {
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
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? '';
    const usage = data?.usage;
    const processingTime = Date.now() - startTime;

    console.log(`⏱️  Time: ${processingTime}ms | Tokens: ${usage?.total_tokens || 'N/A'}`);
    console.log('\n📋 RESULTS:');
    console.log(content);
    
    return {
      title,
      content,
      usage,
      processingTime
    };

  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { title, error: error.message };
  }
}

async function executeFollowUpResearch() {
  console.log('🔬 EXECUTING FOLLOW-UP RESEARCH QUERIES');
  console.log('Claude-Modular Framework Deep Dive Analysis');
  
  const queries = [
    {
      title: "Token Optimization Implementation Details",
      query: `Research advanced token optimization techniques for claude-modular framework:
      
      1. Progressive disclosure patterns and implementation strategies
      2. Context-aware loading mechanisms and algorithms
      3. Layered configuration inheritance systems
      4. Dynamic context pruning techniques
      5. Token usage analytics and monitoring
      6. Memory-efficient prompt engineering patterns
      7. Batch processing optimization for multiple commands
      8. Context window management strategies
      
      Provide specific code examples, configuration patterns, and performance metrics.`
    },
    {
      title: "Command Structure Architecture Analysis",
      query: `Deep dive into claude-modular framework command structures:
      
      1. XML template design patterns and standardization
      2. Command composition and modularity principles
      3. Input/output specification frameworks
      4. Error handling and validation patterns
      5. Command chaining and pipeline architectures
      6. Custom command development guidelines
      7. Command versioning and compatibility management
      8. Performance optimization for command execution
      
      Include implementation examples, design patterns, and architectural decisions.`
    },
    {
      title: "Security Implementation Deep Dive",
      query: `Research comprehensive security patterns in claude-modular framework:
      
      1. Environment variable security and secret management
      2. Permission validation frameworks and RBAC implementation
      3. Audit logging architecture and compliance features
      4. Secret scanning algorithms and pattern detection
      5. Secure communication protocols and encryption
      6. Access control mechanisms and authorization flows
      7. Security monitoring and alerting systems
      8. Vulnerability assessment and mitigation strategies
      
      Provide security architecture examples, threat models, and implementation guides.`
    }
  ];

  const results = [];
  let totalCost = 0;
  
  for (const query of queries) {
    const result = await conductFollowUpResearch(query.query, query.title);
    results.push(result);
    
    if (result.usage) {
      const cost = (result.usage.total_tokens * 0.002) / 1000;
      totalCost += cost;
    }
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 FOLLOW-UP RESEARCH COMPLETE');
  console.log(`💰 Total Estimated Cost: $${totalCost.toFixed(4)}`);
  console.log(`📊 Research Queries: ${results.length}`);
  
  return results;
}

// Execute follow-up research
executeFollowUpResearch()
  .then(results => {
    console.log('\n✅ All follow-up research completed successfully');
    console.log('🔄 Ready for documentation generation phase');
  })
  .catch(error => {
    console.error('💥 Follow-up research failed:', error);
  });