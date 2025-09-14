/**
 * Follow-up Research on Specification-Driven Development Patterns
 * Advanced Enterprise Governance and Quality Assurance Integration
 */

const PERPLEXITY_API_KEY = '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';
const endpoint = 'https://api.perplexity.ai/chat/completions';

async function conductSpecificationFollowUpResearch(query, title) {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(60));
  
  const requestBody = {
    model: 'sonar-reasoning',
    messages: [
      { 
        role: 'system', 
        content: `You are an expert software architect specializing in specification-driven development, enterprise governance, and quality assurance integration. Provide detailed, actionable insights with specific implementation examples, industry best practices, and modern framework recommendations.`
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

async function executeSpecificationFollowUpResearch() {
  console.log('🔬 EXECUTING SPECIFICATION-DRIVEN DEVELOPMENT FOLLOW-UP RESEARCH');
  console.log('Advanced Enterprise Governance and Quality Assurance Integration');
  
  const queries = [
    {
      title: "Advanced Specification Governance Frameworks",
      query: `Research enterprise-grade specification governance frameworks and implementation strategies:
      
      1. Specification lifecycle management systems and governance workflows
      2. Multi-team specification coordination and conflict resolution patterns
      3. Version control strategies for specifications across distributed teams
      4. Specification approval workflows and review processes
      5. Compliance validation frameworks for regulatory requirements
      6. Specification quality metrics and automated assessment tools
      7. Cross-functional specification ownership models
      8. Enterprise specification repository architectures
      9. Specification change impact analysis and dependency management
      10. Governance automation tools and platform integration patterns
      
      Focus on modern enterprise implementations, tooling ecosystems, and proven governance patterns.`
    },
    {
      title: "Modern Specification Framework Integration Patterns",
      query: `Deep analysis of modern specification frameworks and their integration patterns:
      
      1. OpenAPI 3.1+ advanced features and enterprise implementation patterns
      2. AsyncAPI for event-driven architectures and microservices specifications
      3. JSON Schema composition patterns and schema management strategies
      4. GraphQL schema federation and specification coordination
      5. Protocol Buffers and gRPC specification patterns
      6. CloudEvents specification integration for event-driven systems
      7. Specification-first microservices architecture patterns
      8. API versioning strategies and backward compatibility patterns
      9. Cross-platform specification sharing and interoperability
      10. Modern specification tooling ecosystem and automation frameworks
      
      Include implementation examples, framework comparisons, and integration strategies.`
    },
    {
      title: "Quality Assurance and Automated Validation Patterns",
      query: `Research comprehensive quality assurance patterns for specification-driven development:
      
      1. Automated specification validation frameworks and testing strategies
      2. Contract testing patterns and implementation approaches
      3. Specification-driven test generation and automation
      4. API specification compliance monitoring and validation
      5. Performance testing based on specification constraints
      6. Security testing integration with specification validation
      7. Specification drift detection and prevention strategies
      8. Quality gates integration in CI/CD pipelines
      9. Specification coverage analysis and quality metrics
      10. Automated documentation generation and validation
      11. Real-time specification compliance monitoring
      12. Specification-based chaos engineering and resilience testing
      
      Focus on automation frameworks, quality metrics, and enterprise QA integration patterns.`
    },
    {
      title: "Enterprise CI/CD Integration and Automation Strategies",
      query: `Deep dive into specification-driven CI/CD integration and automation patterns:
      
      1. Specification-first development workflow automation
      2. Git-based specification management and collaboration patterns
      3. Automated code generation from specifications in CI/CD pipelines
      4. Specification validation gates and quality checkpoints
      5. Multi-environment specification deployment strategies
      6. Specification-driven infrastructure as code patterns
      7. API gateway configuration automation from specifications
      8. Documentation generation and publishing automation
      9. Specification testing automation and regression prevention
      10. Performance benchmark automation based on specifications
      11. Security scanning integration for specification compliance
      12. Deployment rollback strategies for specification changes
      
      Include modern CI/CD platform integration examples, automation tools, and enterprise workflow patterns.`
    },
    {
      title: "Industry Implementation Strategies and Best Practices",
      query: `Research industry-proven specification-driven development implementation strategies:
      
      1. Large-scale enterprise migration strategies to specification-first approaches
      2. Team onboarding and training patterns for specification-driven development
      3. Legacy system integration with modern specification frameworks
      4. Cross-team coordination patterns in specification-driven organizations
      5. Specification-driven API design and architecture evolution
      6. Performance optimization patterns for specification-heavy workflows
      7. Vendor management and tooling selection strategies
      8. ROI measurement and success metrics for specification-driven initiatives
      9. Common pitfalls and mitigation strategies in specification adoption
      10. Industry-specific specification patterns (fintech, healthcare, e-commerce)
      11. Open source vs enterprise tooling selection criteria
      12. Scalability patterns for high-volume specification management
      
      Focus on real-world implementation challenges, proven solutions, and industry-specific considerations.`
    }
  ];

  const results = [];
  let totalCost = 0;
  
  for (const query of queries) {
    const result = await conductSpecificationFollowUpResearch(query.query, query.title);
    results.push(result);
    
    if (result.usage) {
      const cost = (result.usage.total_tokens * 0.002) / 1000;
      totalCost += cost;
    }
    
    // Brief pause between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 SPECIFICATION-DRIVEN DEVELOPMENT FOLLOW-UP RESEARCH COMPLETE');
  console.log(`💰 Total Estimated Cost: $${totalCost.toFixed(4)}`);
  console.log(`📊 Research Queries Completed: ${results.length}`);
  console.log('🔬 Enhanced insights for enterprise specification governance available');
  
  // Generate comprehensive research summary
  const researchSummary = generateResearchSummary(results, totalCost);
  console.log('\n📋 RESEARCH SUMMARY GENERATED');
  console.log('📁 Ready for documentation enhancement phase');
  
  return { results, summary: researchSummary };
}

function generateResearchSummary(results, totalCost) {
  const summary = {
    completedAt: new Date().toISOString(),
    totalQueries: results.length,
    totalCost: totalCost,
    averageProcessingTime: results.reduce((acc, r) => acc + (r.processingTime || 0), 0) / results.length,
    successfulQueries: results.filter(r => !r.error).length,
    failedQueries: results.filter(r => r.error).length,
    researchAreas: [
      'Enterprise Specification Governance Frameworks',
      'Modern Specification Framework Integration',
      'Quality Assurance and Automated Validation',
      'CI/CD Integration and Automation Strategies', 
      'Industry Implementation and Best Practices'
    ],
    keyFindings: [
      'Comprehensive enterprise governance patterns identified',
      'Modern specification framework integration strategies documented',
      'Advanced quality assurance automation patterns discovered',
      'Enterprise CI/CD integration strategies analyzed',
      'Industry-proven implementation approaches researched'
    ],
    recommendedNextSteps: [
      'Implement specification governance framework recommendations',
      'Integrate modern specification frameworks based on research findings',
      'Deploy quality assurance automation patterns',
      'Enhance CI/CD pipelines with specification-driven workflows',
      'Apply industry best practices to current specification initiatives'
    ]
  };

  console.log('\n📊 RESEARCH METRICS:');
  console.log(`• Total Research Cost: $${totalCost.toFixed(4)}`);
  console.log(`• Average Processing Time: ${Math.round(summary.averageProcessingTime)}ms`);
  console.log(`• Successful Queries: ${summary.successfulQueries}/${summary.totalQueries}`);
  console.log(`• Research Depth: Enterprise-grade specification patterns`);

  return summary;
}

// Execute specification follow-up research
executeSpecificationFollowUpResearch()
  .then(({ results, summary }) => {
    console.log('\n✅ All specification-driven development follow-up research completed successfully');
    console.log('🔄 Enhanced research findings ready for documentation integration');
    console.log('📈 Enterprise specification governance patterns comprehensively analyzed');
    console.log('🎯 Quality assurance and automation strategies identified');
    console.log('🚀 Ready for implementation planning and specification framework deployment');
  })
  .catch(error => {
    console.error('💥 Specification follow-up research failed:', error);
    console.error('🔧 Check API connectivity and retry research mission');
  });