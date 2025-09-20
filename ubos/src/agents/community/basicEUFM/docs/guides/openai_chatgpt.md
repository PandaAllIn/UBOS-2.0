# OpenAI (ChatGPT)

Purpose: General LLM capabilities (chat, tools, code, vision, structured outputs).

## Official docs
- Docs home: https://platform.openai.com/docs
- API reference: https://platform.openai.com/docs/api-reference
- Models: https://platform.openai.com/docs/models

## Key concepts
- Responses API with tool/function calling and JSON schema
- Assistants API for stateful orchestration (optional)

## Auth
- Bearer API key; consider org/project scoping

## Notes for integration
- Use JSON schema for reliable tool calls
- Log prompts/outputs to our audit store; avoid sending secrets in prompts
