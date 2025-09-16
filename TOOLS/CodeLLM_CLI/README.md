# CodeLLM CLI Integration for UBOS-2.0

This directory contains the integration layer and helper scripts to use the CodeLLM CLI within the UBOS-2.0 system.

## Overview

CodeLLM CLI is a powerful AI coding assistant that can enhance UBOS by providing advanced code generation, refactoring, documentation, and compliance analysis capabilities.

## Directory Structure

```
TOOLS/CodeLLM_CLI/
├── src/                  # TypeScript wrapper and integration code
├── scripts/              # Helper scripts for setup and testing
└── docs/                 # Documentation and guides
```

## Setup

1. Install CodeLLM CLI globally or locally.
2. Configure authentication using API key or device login.
3. Use the TypeScript wrapper (`src/codellmCLI.ts`) to interact with the CLI programmatically.

## Usage Examples

- Generate code from UBOS specs
- Refactor existing agents
- Generate EU funding documentation
- Analyze codebase for compliance

## Notes

- Ensure environment variables like `ABACUS_API_KEY` are set.
- Adapt CLI command arguments as needed based on CodeLLM CLI updates.

---

For detailed integration instructions, see `docs/integration-guide.md` (to be created).
