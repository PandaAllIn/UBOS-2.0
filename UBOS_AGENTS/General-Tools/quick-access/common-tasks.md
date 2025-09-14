# Common Tasks Guide

**Auto-maintained by**: Research & Documentation Agent  
**Purpose**: Step-by-step guides for frequently performed tasks

## 🔬 Research Tasks

### Deep Framework Research
```bash
# 1. Initiate research mission
research_agent.run({
  input: "claude-modular framework deep analysis",
  type: "framework_research",
  depth: "deep"
});

# 2. Review organized documentation
cd General-Tools/frameworks/claude-modular/
cat quick-reference.md

# 3. Check handoff recommendations  
# Agent will suggest Organization Agent if complex structuring needed
```

### Tool Documentation Aggregation
```bash
# 1. Research tool ecosystem
research_agent.run({
  input: "development tools for AI workflows",
  type: "tool_documentation"  
});

# 2. Access organized results
ls General-Tools/tools/development/
cat General-Tools/tools/index.md
```

## 📁 Documentation Organization

### Create Framework Documentation
1. **Research**: Agent discovers framework information
2. **Structure**: Creates organized folder hierarchy
3. **Extract**: Pulls key concepts into quick-reference
4. **Cross-reference**: Links related frameworks and patterns

### Update Quick References
```bash
# Auto-generated during research
# Manual updates if needed:
edit General-Tools/frameworks/{name}/quick-reference.md
```

## 🔄 Agent Coordination

### Research → Organization Handoff
```typescript
// Research completes and triggers handoff
if (findings.complexity === 'high') {
  transferTo(OrganizationAgent, {
    researchResults,
    organizationNeeds: 'complex_structuring',
    targetPath: 'General-Tools/frameworks/complex-framework/'
  });
}
```

### Research → Development Handoff  
```typescript
// Implementation-ready research
if (findings.implementationReadiness === 'ready') {
  transferTo(DevelopmentAgent, {
    implementationPlan,
    specifications: extractedSpecs,
    quickReference: generatedQuickRef
  });
}
```

## 🎯 Optimization Tasks

### Token Optimization Application
1. **Analyze Content**: Research agent identifies verbose sections
2. **Apply Progressive Disclosure**: Layer information by complexity
3. **Create Modular Structure**: Break into reusable components  
4. **Validate Efficiency**: Measure token reduction (target: 50-80%)

### Cross-Reference Maintenance
1. **Identify Relationships**: Agent maps related frameworks/tools
2. **Create Link Structure**: Establish cross-references
3. **Update Index**: Maintain searchable index
4. **Validate Links**: Ensure references remain accurate

## 🚀 Quick Start Workflows

### New Framework Integration
```bash
# 1. Research
"Research {framework-name} for integration with UBOS system"

# 2. Wait for completion + organization
# 3. Review quick-reference
cat General-Tools/frameworks/{framework-name}/quick-reference.md  

# 4. Follow implementation guide
cat General-Tools/frameworks/{framework-name}/implementation.md
```

### Competitive Analysis
```bash
# 1. Comparative research  
"Compare {framework-A} vs {framework-B} for {specific-use-case}"

# 2. Review analysis
cat General-Tools/patterns/competitive-analysis/latest-report.md

# 3. Apply findings
# Use insights for architectural decisions
```

---
*Task guides updated based on actual usage patterns and agent performance*