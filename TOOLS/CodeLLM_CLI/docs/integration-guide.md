# CodeLLM CLI Integration Guide for UBOS-2.0

## Introduction

This guide explains how to integrate and use the CodeLLM CLI within the UBOS-2.0 system to enhance AI-assisted development, code generation, refactoring, documentation, and compliance analysis.

## Prerequisites

- CodeLLM CLI installed globally or locally
- API key or device login for authentication
- Node.js 20.x+ and TypeScript 5.9+ environment
- UBOS-2.0 project cloned and set up

## Setup

1. **Install CodeLLM CLI**

```bash
npm install -g @abacus-ai/codellm-cli
```

2. **Authenticate**

```bash
export ABACUS_API_KEY="your-api-key"
code-llm-cli login
```

3. **Configure Environment**

Ensure environment variables are set in your shell or CI environment.

## Usage

### Using the TypeScript Wrapper

Import and create an instance:

```typescript
import { createCodeLLMCLI } from '../src/codellmCLI';

const codellm = createCodeLLMCLI({
  projectRoot: process.cwd(),
  apiKey: process.env.ABACUS_API_KEY
});

await codellm.initialize();

// Generate code from spec
const response = await codellm.generateFromSpec('ubos/specs/kernel/constitution.spec.md');
console.log(response.output);
```

### CLI Commands

You can also run commands directly in the terminal:

```bash
code-llm-cli generate --prompt "Generate TypeScript implementation from this UBOS specification" --project-root .
```

## Integration Points

- `TOOLS/CodeLLM_CLI/src/codellmCLI.ts`: TypeScript wrapper
- `src/agents/premium/CodeLLMAgent.ts`: (To be created) Agent leveraging CodeLLM
- `src/orchestrator/`: Extend orchestration to include CodeLLM tasks

## Best Practices

- Keep API keys secure and out of version control
- Use environment variables for configuration
- Regularly update CodeLLM CLI for new features

## Troubleshooting

- Ensure Node.js and TypeScript versions are compatible
- Check API key validity and permissions
- Review CLI output logs for errors

---

For more information, visit [CodeLLM by Abacus.AI](https://codellm.abacus.ai/)
