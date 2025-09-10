# Anthropic Claude

Purpose: Safety-focused LLM for chat, tool use, code, and long context.

## Official docs
- Docs home: https://docs.anthropic.com/claude
- API reference: https://docs.anthropic.com/claude/reference
- Models: https://docs.anthropic.com/claude/docs/models-overview

## SDKs
- Python: https://github.com/anthropics/anthropic-sdk-python
- JavaScript: https://github.com/anthropics/anthropic-sdk-typescript

## Notes for integration
- Use tools/functions with JSON schema; send minimal, structured inputs
- Respect safety filters; handle `block` or `stop_reason` states
