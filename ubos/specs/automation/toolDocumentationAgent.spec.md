---
version: 1.0.0
type: toolDocumentationAgent
status: draft
author: your-name
---

# ToolDocumentationAgent Specification

## Overview
The **ToolDocumentationAgent** is a UBOS 2.0 native agent designed to automatically gather and summarize documentation for all tools present in the repository. It scans both the `General TOOLS` directory (containing user‑provided tool resources) and the `UBOS/specs` directory (containing spec files) to produce a structured JSON report.

## Agent Type
`tool-docs`

## Capabilities
- **file_operations** – reads files from the filesystem.
- **research** – extracts relevant excerpts and aggregates them.
- **meta_analysis** – combines documentation from multiple sources into a unified view.

## Input
The agent does not require any external input parameters. It operates solely based on the repository’s file structure.

## Output
A JSON array where each element has the shape:

```json
{
  "tool": "ToolName",
  "file": "relative/path/to/documentation.file",
  "excerpt": "First 200 characters of the file content or a placeholder for binary files."
}
```

The output includes entries for:
- Markdown (`.md`), plain text (`.txt`), Word (`.docx`), PDF (`.pdf`) files found under `General TOOLS`.
- Specification files (`*.spec.md`) found under `UBOS/specs`.

## Execution Flow
1. Resolve the absolute paths for `General TOOLS` and `UBOS/specs`.
2. Recursively walk each directory.
3. For each supported file type:
   - Read the file (or note binary presence).
   - Extract the first 200 characters as an excerpt.
   - Derive the tool name from the parent directory (or use `"spec"` for spec files).
4. Concatenate results from both sources.
5. Return the JSON stringified payload.

## Error Handling
- Files that cannot be read are recorded with an excerpt of `"[unreadable]"`.
- Binary files (`.docx`, `.pdf`) are recorded with an excerpt of `"[binary <ext> file]"`.
- All filesystem operations are wrapped in `try/catch` blocks; any unexpected error results in a failed `AgentResult` with the error message.

## Registration
- Imported and registered in `UBOS/src/orchestrator/agentFactory.ts` under the case `'tool-docs'`.
- Added to the `AgentSpec.type` union in `UBOS/src/orchestrator/types.ts`.

## Example Usage
```ts
const spec: AgentSpec = {
  id: 'doc-agent-001',
  type: 'tool-docs',
  requirementId: 'req-123',
  capabilities: ['file_operations', 'research', 'meta_analysis']
};

const agent = new AgentFactory().create(spec);
const result = await agent.run({ input: '' });
console.log(JSON.parse(result.output));
```

## Future Enhancements
- Add support for additional file formats (e.g., `.html`, `.mdx`).
- Introduce filtering options (e.g., include only tools with a certain tag).
- Provide a CLI wrapper for ad‑hoc documentation generation.

---
