# Sonar APIs

Primary: Perplexity Sonar (LLM models)

## Perplexity Sonar
- API docs: https://docs.perplexity.ai/

Notes:
- OpenAI-compatible style chat completions
- Auth: Bearer API key
- Use JSON tool calling where supported; log prompts/outputs for auditing
- Check rate limits and model names under the docs (e.g., `sonar-*`)

## SonarQube/SonarCloud (code quality)
- SonarQube docs: https://docs.sonarsource.com/sonarqube/latest/
- SonarQube Web API: https://docs.sonarsource.com/sonarqube/latest/extension-guide/web-api/
- SonarCloud Web API: https://sonarcloud.io/web_api

Notes:
- Optional for later; token auth; project analysis results can gate PRs
