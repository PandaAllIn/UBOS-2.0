#!/usr/bin/env python3
"""
SpecKit Research & Documentation Agent
Enhanced Perplexity Sonar Integration for Comprehensive Methodology Research

This agent provides comprehensive research capabilities for SpecKit methodology
using Perplexity Sonar's deep research and reasoning models.
"""

import asyncio
import json
import os
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ResearchQuery:
    """Research query configuration"""
    query: str
    focus_areas: List[str]
    depth_level: str = "deep"  # shallow, medium, deep, comprehensive
    model: str = "sonar-reasoning"
    follow_up_queries: List[str] = None
    
    def __post_init__(self):
        if self.follow_up_queries is None:
            self.follow_up_queries = []

@dataclass
class ResearchResult:
    """Research result structure"""
    query: str
    response: str
    sources: List[Dict[str, Any]]
    timestamp: datetime
    model_used: str
    follow_up_insights: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.follow_up_insights is None:
            self.follow_up_insights = []

class EnhancedPerplexityResearch:
    """Enhanced Perplexity research agent with Sonar integration"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('PERPLEXITY_API_KEY')
        if not self.api_key:
            logger.warning("No Perplexity API key found. Using mock responses for demonstration.")
        
        self.base_url = "https://api.perplexity.ai"
        self.models = {
            "sonar-reasoning": "llama-3.1-sonar-large-128k-online",
            "sonar-small": "llama-3.1-sonar-small-128k-online", 
            "sonar-large": "llama-3.1-sonar-large-128k-online",
            "sonar-huge": "llama-3.1-sonar-huge-128k-online"
        }
        
    async def conduct_research(self, query: ResearchQuery) -> ResearchResult:
        """Conduct comprehensive research using Perplexity Sonar"""
        logger.info(f"Starting research: {query.query}")
        
        if not self.api_key:
            return self._mock_research_result(query)
        
        try:
            async with httpx.AsyncClient() as client:
                # Main research query
                main_response = await self._make_research_request(client, query)
                
                # Follow-up queries for deeper insights
                follow_up_results = []
                for follow_up in query.follow_up_queries:
                    follow_up_query = ResearchQuery(
                        query=follow_up,
                        focus_areas=query.focus_areas,
                        depth_level=query.depth_level,
                        model=query.model
                    )
                    follow_up_result = await self._make_research_request(client, follow_up_query)
                    follow_up_results.append({
                        "query": follow_up,
                        "result": follow_up_result
                    })
                
                return ResearchResult(
                    query=query.query,
                    response=main_response.get("choices", [{}])[0].get("message", {}).get("content", ""),
                    sources=self._extract_sources(main_response),
                    timestamp=datetime.now(),
                    model_used=query.model,
                    follow_up_insights=follow_up_results
                )
                
        except Exception as e:
            logger.error(f"Research failed: {str(e)}")
            return self._mock_research_result(query)
    
    async def _make_research_request(self, client: httpx.AsyncClient, query: ResearchQuery) -> Dict[str, Any]:
        """Make API request to Perplexity"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Enhanced prompt for comprehensive research
        enhanced_prompt = self._create_enhanced_prompt(query)
        
        payload = {
            "model": self.models.get(query.model, "llama-3.1-sonar-large-128k-online"),
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert research analyst specializing in software development methodologies, AI agent coordination, and specification-driven development. Provide comprehensive, well-sourced analysis with actionable insights."
                },
                {
                    "role": "user", 
                    "content": enhanced_prompt
                }
            ],
            "temperature": 0.1,
            "top_p": 0.9,
            "return_citations": True,
            "search_domain_filter": ["github.com", "medium.com", "dev.to", "arxiv.org", "stackoverflow.com"],
            "search_recency_filter": "month"
        }
        
        response = await client.post(f"{self.base_url}/chat/completions", 
                                   headers=headers, 
                                   json=payload,
                                   timeout=120.0)
        response.raise_for_status()
        return response.json()
    
    def _create_enhanced_prompt(self, query: ResearchQuery) -> str:
        """Create enhanced research prompt with specific focus areas"""
        focus_areas_text = ", ".join(query.focus_areas) if query.focus_areas else "general analysis"
        
        prompt = f"""
Conduct {query.depth_level} research on: {query.query}

Focus Areas: {focus_areas_text}

Research Requirements:
1. Provide comprehensive analysis with specific examples and code snippets where applicable
2. Include recent developments and industry trends (within last 12 months)
3. Compare with alternative approaches and competitive solutions
4. Identify implementation challenges and best practices
5. Include relevant GitHub repositories, documentation, and community resources
6. Analyze enterprise adoption patterns and use cases
7. Provide actionable insights for implementation teams

Structure your response with:
- Executive Summary
- Detailed Analysis
- Implementation Strategies
- Comparative Analysis
- Recent Developments
- Community Resources
- Actionable Recommendations

Prioritize authoritative sources and practical insights over theoretical concepts.
"""
        return prompt
    
    def _extract_sources(self, response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract and format sources from Perplexity response"""
        sources = []
        citations = response.get("citations", [])
        
        for citation in citations:
            sources.append({
                "url": citation.get("url", ""),
                "title": citation.get("title", ""),
                "snippet": citation.get("text", "")[:200] + "..." if len(citation.get("text", "")) > 200 else citation.get("text", "")
            })
        
        return sources
    
    def _mock_research_result(self, query: ResearchQuery) -> ResearchResult:
        """Generate mock research result for demonstration"""
        mock_response = f"""
# Research Analysis: {query.query}

## Executive Summary
[Mock Response - API Key Required for Live Research]

This would contain comprehensive analysis of {query.query} with focus on {', '.join(query.focus_areas) if query.focus_areas else 'general analysis'}.

## Detailed Analysis
Comprehensive research would be conducted using Perplexity Sonar's {query.model} model with {query.depth_level} analysis depth.

## Implementation Strategies
- Strategy 1: [Detailed implementation approach]
- Strategy 2: [Alternative implementation method]
- Strategy 3: [Enterprise-scale deployment]

## Recent Developments
Latest industry trends and developments within the last 12 months.

## Actionable Recommendations
Specific, implementable recommendations for development teams.
"""
        
        return ResearchResult(
            query=query.query,
            response=mock_response,
            sources=[{"url": "mock://source", "title": "Mock Source", "snippet": "Mock source content"}],
            timestamp=datetime.now(),
            model_used=query.model
        )

class SpecKitResearchAgent:
    """Specialized research agent for SpecKit methodology"""
    
    def __init__(self):
        self.perplexity = EnhancedPerplexityResearch()
        self.research_history = []
        
    async def comprehensive_speckit_research(self) -> Dict[str, ResearchResult]:
        """Conduct comprehensive SpecKit research across multiple dimensions"""
        
        research_queries = self._define_research_queries()
        results = {}
        
        for query_name, query in research_queries.items():
            logger.info(f"Conducting research: {query_name}")
            result = await self.perplexity.conduct_research(query)
            results[query_name] = result
            self.research_history.append(result)
            
            # Brief pause between requests to respect rate limits
            await asyncio.sleep(2)
        
        return results
    
    def _define_research_queries(self) -> Dict[str, ResearchQuery]:
        """Define comprehensive research queries for SpecKit methodology"""
        
        return {
            "speckit_fundamentals": ResearchQuery(
                query="GitHub SpecKit methodology specification-driven development framework analysis",
                focus_areas=[
                    "executable specifications",
                    "specification syntax and structure", 
                    "integration patterns",
                    "developer workflow",
                    "tooling ecosystem"
                ],
                depth_level="comprehensive",
                follow_up_queries=[
                    "SpecKit vs traditional BDD frameworks comparison",
                    "SpecKit enterprise adoption case studies",
                    "SpecKit performance benchmarks and optimization"
                ]
            ),
            
            "ai_agent_coordination": ResearchQuery(
                query="AI agent coordination patterns specification-driven development multi-agent systems",
                focus_areas=[
                    "agent orchestration frameworks",
                    "specification-based coordination",
                    "inter-agent communication protocols",
                    "distributed agent architectures",
                    "agent specification languages"
                ],
                depth_level="deep",
                follow_up_queries=[
                    "OpenAI Swarm vs SpecKit agent coordination comparison",
                    "Agent specification validation and testing strategies",
                    "Multi-agent specification conflict resolution"
                ]
            ),
            
            "executable_specifications": ResearchQuery(
                query="executable specifications programming living documentation test-driven development",
                focus_areas=[
                    "specification execution engines",
                    "specification testing frameworks", 
                    "living documentation systems",
                    "specification validation tools",
                    "behavioral specification languages"
                ],
                depth_level="comprehensive",
                follow_up_queries=[
                    "Cucumber vs SpecKit executable specifications comparison",
                    "Specification-driven API development best practices",
                    "Specification performance optimization techniques"
                ]
            ),
            
            "competitive_analysis": ResearchQuery(
                query="specification-driven development frameworks comparison BDD Cucumber Gherkin SpecFlow alternatives",
                focus_areas=[
                    "framework feature comparison",
                    "performance benchmarks",
                    "ecosystem maturity",
                    "enterprise adoption",
                    "learning curve analysis"
                ],
                depth_level="comprehensive",
                follow_up_queries=[
                    "Migration strategies from traditional BDD to SpecKit",
                    "Hybrid specification framework approaches",
                    "Cost-benefit analysis specification-driven development adoption"
                ]
            ),
            
            "implementation_strategies": ResearchQuery(
                query="SpecKit implementation strategies enterprise deployment patterns best practices",
                focus_areas=[
                    "deployment architectures",
                    "integration patterns",
                    "scalability considerations",
                    "team adoption strategies",
                    "governance frameworks"
                ],
                depth_level="deep",
                follow_up_queries=[
                    "SpecKit CI/CD pipeline integration patterns",
                    "SpecKit monitoring and observability strategies",
                    "SpecKit security and compliance considerations"
                ]
            ),
            
            "advanced_patterns": ResearchQuery(
                query="advanced specification patterns microservices event-driven architecture domain-driven design",
                focus_areas=[
                    "microservices specification patterns",
                    "event-driven specification modeling",
                    "domain boundary specifications",
                    "specification composition strategies",
                    "cross-service specification coordination"
                ],
                depth_level="deep",
                follow_up_queries=[
                    "Event sourcing with specification-driven development",
                    "CQRS pattern specification modeling",
                    "Saga pattern specification coordination"
                ]
            )
        }
    
    def generate_documentation(self, results: Dict[str, ResearchResult]) -> str:
        """Generate comprehensive documentation from research results"""
        
        doc = f"""# SpecKit Methodology: Comprehensive Research Analysis

*Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Executive Summary

This comprehensive research analysis explores GitHub's SpecKit methodology and specification-driven development patterns using advanced AI research capabilities. The analysis covers fundamental concepts, implementation strategies, competitive landscape, and advanced architectural patterns.

"""
        
        for section_name, result in results.items():
            doc += f"""
## {section_name.replace('_', ' ').title()}

### Research Query
**Focus**: {result.query}

### Analysis
{result.response}

### Key Sources
"""
            for source in result.sources[:3]:  # Top 3 sources
                doc += f"- [{source['title']}]({source['url']}): {source['snippet']}\n"
            
            if result.follow_up_insights:
                doc += "\n### Advanced Insights\n"
                for insight in result.follow_up_insights:
                    doc += f"\n**{insight['query']}**\n"
                    if isinstance(insight['result'], dict):
                        content = insight['result'].get('choices', [{}])[0].get('message', {}).get('content', '')
                        doc += f"{content[:500]}...\n" if len(content) > 500 else f"{content}\n"
            
            doc += "\n---\n"
        
        # Add implementation roadmap
        doc += self._generate_implementation_roadmap()
        
        return doc
    
    def _generate_implementation_roadmap(self) -> str:
        """Generate implementation roadmap based on research"""
        return """
## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] SpecKit framework evaluation and setup
- [ ] Core team training and onboarding
- [ ] Initial specification patterns development
- [ ] Development environment configuration

### Phase 2: Pilot Implementation (Weeks 3-6)
- [ ] Select pilot project for SpecKit adoption
- [ ] Develop initial executable specifications
- [ ] Implement specification execution pipeline
- [ ] Establish testing and validation processes

### Phase 3: Advanced Patterns (Weeks 7-10)
- [ ] Implement AI agent coordination patterns
- [ ] Develop advanced specification composition
- [ ] Integrate with existing development workflows
- [ ] Establish governance and best practices

### Phase 4: Scale and Optimize (Weeks 11-12)
- [ ] Scale to additional teams and projects
- [ ] Performance optimization and monitoring
- [ ] Documentation and knowledge sharing
- [ ] Continuous improvement processes

## Next Steps

1. **Technical Evaluation**: Conduct hands-on evaluation of SpecKit framework
2. **Team Readiness Assessment**: Evaluate team skills and training needs
3. **Pilot Project Selection**: Choose appropriate project for initial implementation
4. **Stakeholder Alignment**: Ensure leadership support and resource allocation

## Resources for Further Learning

- Official SpecKit documentation and examples
- Community forums and discussion groups
- Training materials and certification programs
- Consulting and professional services options

---

*This analysis was generated using Enhanced Perplexity Research with Sonar reasoning capabilities for comprehensive methodology exploration.*
"""

async def main():
    """Main execution function for SpecKit research"""
    print("🔍 Deploying SpecKit Research & Documentation Agent...")
    
    agent = SpecKitResearchAgent()
    
    print("📊 Conducting comprehensive SpecKit methodology research...")
    results = await agent.comprehensive_speckit_research()
    
    print("📄 Generating enhanced documentation...")
    documentation = agent.generate_documentation(results)
    
    # Save documentation
    output_path = "/Users/apple/Desktop/UBOS_2.0/UBOS_AGENTS/General-Tools/frameworks/spec-kit/comprehensive-research-analysis.md"
    with open(output_path, 'w') as f:
        f.write(documentation)
    
    print(f"✅ Research completed! Documentation saved to: {output_path}")
    
    # Generate research summary
    print("\n📋 Research Summary:")
    for query_name, result in results.items():
        print(f"  - {query_name}: {len(result.response)} characters of analysis")
        print(f"    Sources: {len(result.sources)} references")
        print(f"    Follow-ups: {len(result.follow_up_insights)} additional insights")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())