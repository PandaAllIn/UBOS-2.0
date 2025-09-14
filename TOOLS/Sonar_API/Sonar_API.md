# Sonar API

**Category**: api_service  
**Priority**: high
**Research Model**: sonar-reasoning
**Confidence**: 95%
**Research Cost**: $0.0047
**Processing Time**: 42 seconds
**Generated**: 2025-09-12T18:28:03.635Z

---

<think>
The user is asking for comprehensive documentation for the Sonar API by Perplexity. They want me to structure this as technical documentation with specific sections. Let me analyze the search results to extract the relevant information:

From the search results I can see:

1. Sonar API is Perplexity's language model that combines real-time web search with natural language processing
2. It's available through the AI SDK provider (@ai-sdk/perplexity)
3. There are different models available (sonar-pro, sonar-small/medium, etc.)
4. It provides real-time information with citations
5. The API follows similar conventions to OpenAI
6. There's a deep research model available
7. Authentication uses API keys
8. Base URL is https://api.perplexity.ai

I need to structure this according to the user's requested format and provide comprehensive technical documentation. Since this is a coding/API documentation request, I should follow the guidelines for that type of query, using code blocks with proper syntax highlighting and providing practical examples.

Let me organize this information according to the requested sections:

1. Overview & Purpose
2. Installation & Setup
3. Core Features
4. Usage Examples
5. API Reference
6. Integration Guide
7. Configuration
8. Troubleshooting
9. Best Practices
10. Resources

I should use proper markdown formatting with headers, code blocks, and tables where appropriate. I also need to cite the search results appropriately.
</think>

Sonar API is Perplexity's cutting-edge language model that uniquely combines real-time web search with natural language processing, delivering current information with detailed citations for enhanced research capabilities and fact-checking[1]. Built on top of Llama 3.3 70B, Sonar has been optimized for answer factuality and readability, achieving blazing fast speeds of 1200 tokens per second through Cerebras inference infrastructure[3].

## Overview & Purpose

The Sonar API serves as a powerful AI answer engine that performs real-time online searches while delivering conversational AI responses[4]. Unlike standard language models, Sonar researches topics dynamically, provides factual answers with proper source attribution, and maintains access to current information rather than relying solely on training data[4]. This makes it ideal for applications requiring up-to-date information, research assistance, and fact-checking capabilities.

**Primary Use Cases:**
- Real-time research and information retrieval
- Fact-checking and verification
- Current events and news analysis
- Academic research assistance
- Business intelligence gathering
- Content creation with source attribution

## Installation & Setup

### Using AI SDK

Install the Perplexity provider module:

```bash
pnpm add @ai-sdk/perplexity
```

### Alternative Package Managers

```bash
# Using npm
npm install @ai-sdk/perplexity

# Using yarn
yarn add @ai-sdk/perplexity
```

### Basic Import

```javascript
import { perplexity } from '@ai-sdk/perplexity';
```

### Custom Configuration

```javascript
import { createPerplexity } from '@ai-sdk/perplexity';

const perplexity = createPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY ?? '',
});
```

## Core Features

### **Real-Time Web Search Integration**
Sonar performs live searches across hundreds of sources, ensuring responses contain current information rather than outdated training data[5].

### **Source Citation System**
Every response includes detailed citations with links to original sources, enabling users to verify information and conduct deeper research[1].

### **Multiple Model Options**
- **sonar-pro**: Flagship model with advanced search capabilities and comprehensive answers[4]
- **sonar-small/medium**: Efficient models for simpler queries and basic information retrieval[4]
- **sonar-deep-research**: Powerful research model capable of exhaustive searches across hundreds of sources[5]

### **High-Speed Performance**
Sonar delivers answers at 1200 tokens per second, providing nearly instant response generation while maintaining accuracy[3].

## Usage Examples

### Basic Chat Completion

```javascript
import { perplexity } from '@ai-sdk/perplexity';
import { generateText } from 'ai';

const { text } = await generateText({
  model: perplexity('sonar-pro'),
  prompt: 'What are the latest developments in quantum computing?',
});

console.log(text);
```

### Deep Research Query

```bash
curl --request POST \
  --url https://api.perplexity.ai/chat/completions \
  --header "Authorization: Bearer <token>" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "sonar-deep-research",
    "messages": [
      {
        "role": "user",
        "content": "Conduct a comprehensive analysis of the quantum computing industry, including technological approaches, key players, market opportunities, regulatory challenges, and commercial viability projections through 2035."
      }
    ]
  }'
```

### Streaming Response

```javascript
import { perplexity } from '@ai-sdk/perplexity';
import { streamText } from 'ai';

const { textStream } = await streamText({
  model: perplexity('sonar-pro'),
  prompt: 'Explain the current state of renewable energy adoption globally',
});

for await (const textPart of textStream) {
  process.stdout.write(textPart);
}
```

## API Reference

### **Base URL**
```
https://api.perplexity.ai
```

### **Available Models**

| Model | Description | Use Case |
|-------|-------------|----------|
| `sonar-pro` | Flagship model with advanced search capabilities | Complex queries requiring comprehensive research |
| `sonar-small` | Efficient model for basic queries | Simple information retrieval |
| `sonar-medium` | Balanced performance and capabilities | General-purpose applications |
| `sonar-deep-research` | Exhaustive research model | In-depth analysis and research projects |
| `mistral-7b` | Open-source balanced model | Various general tasks |
| `codellama-34b` | Code-specialized model | Programming and development queries |

### **Core Endpoints**

**Chat Completions**
```
POST /chat/completions
```

**Request Parameters:**
- `model`: Model identifier (required)
- `messages`: Array of message objects (required)
- `temperature`: Controls randomness (0.0-2.0)
- `max_tokens`: Maximum response length
- `stream`: Enable streaming responses

## Integration Guide

### **OpenAI Compatibility**
Sonar API follows similar conventions to OpenAI, making migration straightforward for developers familiar with GPT implementations[4].

```javascript
// Direct API integration
const response = await fetch('https://api.perplexity.ai/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'sonar-pro',
    messages: [{ role: 'user', content: 'Your query here' }],
  }),
});
```

### **Framework Integration**
Works seamlessly with popular AI frameworks and libraries that support OpenAI-compatible APIs.

## Configuration

### **Environment Variables**

```bash
# Required
PERPLEXITY_API_KEY=your_api_key_here

# Optional
PERPLEXITY_BASE_URL=https://api.perplexity.ai
```

### **Provider Configuration Options**

```javascript
const perplexity = createPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',  // Custom base URL
  headers: {                              // Custom headers
    'Custom-Header': 'value'
  },
  fetch: customFetchImplementation        // Custom fetch function
});
```

### **Authentication Setup**

1. Visit the [Perplexity Platform](https://www.perplexity.ai) to obtain API keys[1]
2. Set the `PERPLEXITY_API_KEY` environment variable
3. Include the API key in the Authorization header: `Bearer <token>`

## Troubleshooting

### **Common Issues**

**API Key Authentication Errors**
- Verify API key is correctly set in environment variables
- Ensure the Authorization header format: `Bearer <your_api_key>`

**Rate Limiting**
- Implement exponential backoff for retry logic
- Monitor usage through response metadata

**Model Availability**
- Check model names against the official model list
- Some models may have specific access requirements

### **Response Validation**

```javascript
const response = await fetch(url, options);
if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error);
  throw new Error(`API request failed: ${response.status}`);
}
```

## Best Practices

### **Cost Management**
Monitor token usage through response metadata, especially for deep research queries which can consume significant tokens for reasoning and citations[5].

### **Prompt Engineering**
- Be specific about information requirements
- Request citations when source verification is important
- Use appropriate models for different complexity levels

### **Context Management**
- Maintain conversation context through message arrays
- Implement proper error handling for API failures
- Cache responses when appropriate to reduce API calls

### **Performance Optimization**
- Use streaming for long responses to improve user experience
- Select the most appropriate model for each use case
- Implement request batching where possible

## Resources

### **Official Documentation**
- [Perplexity API Documentation](https://docs.perplexity.ai)[2]
- [AI SDK Perplexity Provider Guide](https://ai-sdk.dev/providers/ai-sdk-providers/perplexity)[1]
- [Sonar API Cookbook](https://docs.perplexity.ai/cookbook)[2]

### **Community Resources**
- [GitHub Repository with Examples](https://github.com/perplexity-ai)[2]
- [Perplexity Labs Playground](https://sonar.perplexity.ai)[6]
- [Integration Tutorials and Guides](https://docs.perplexity.ai/cookbook)[2]

### **Getting Started**
API keys can be obtained from the Perplexity Platform, and the comprehensive cookbook provides ready-to-run projects demonstrating specific use cases and implementation patterns[1][2].

---

**Metadata**:
- Content Length: 9994 characters
- Tokens Used: 2,370
- Sources Found: 13

*Generated by UBOS 2.0 Enhanced Tool Documentation Agent*
*Powered by Perplexity Sonar API*
