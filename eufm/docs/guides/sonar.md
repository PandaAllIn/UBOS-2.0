# Sonar APIs

Primary: Perplexity Sonar (LLM models)

## Perplexity Sonar
- API docs: https://docs.perplexity.ai/
- Models: https://docs.perplexity.ai/getting-started/models

Notes:
- OpenAI-compatible style chat completions
- Auth: Bearer API key
- Use JSON tool calling where supported; log prompts/outputs for auditing
 - Model names (examples): `sonar-pro`, `sonar-reasoning-pro`, `sonar-small`
 - Check rate limits and current availability under the Models page

## SonarQube/SonarCloud (code quality)
- SonarQube docs: https://docs.sonarsource.com/sonarqube/latest/
- SonarQube Web API: https://docs.sonarsource.com/sonarqube/latest/extension-guide/web-api/
- SonarCloud Web API: https://sonarcloud.io/web_api

Notes:
- Optional for later; token auth; project analysis results can gate PRs
