# Integration Adapters and Tool Registry

## Provider Adapter (LLM)
Required methods (conceptual):
- `complete(prompt, options)` → { text, usage, warnings }
- `stream(prompt, options)` → AsyncIterable events
- `useTools(messages, tools, options)` → tool calls + responses
- `batch(requests, options)` → bulk throughput

Common options:
- model, temperature/top_p, max_output_tokens, system, stop, json_schema

## Tool Interface
- `name`: unique identifier
- `schema`: JSON schema for validated inputs
- `invoke(context, input)`: executes and returns `{ ok, data|error }`
- `permissions`: scopes required

## Registry
- Map of tool `name` → implementation, metadata, rate limits
- Capability graph to express dependencies and compose tools

## Error handling
- Standard error shape `{ code, message, details }`
- Retry policy per tool (idempotency hints)

## Versioning
- Adapter and tool semver; migration notes in each tool doc
