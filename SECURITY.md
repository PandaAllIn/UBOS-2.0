# Security Policy

## Reporting a Vulnerability
- Please open a private security advisory or email the maintainers.

## Secrets & credentials
- Do not commit secrets. Use local env vars or a secret manager.
- Prefer provider-scoped, least-privilege tokens (e.g., GitHub App, GCP IAM).

## Data handling
- Avoid sending sensitive data to LLMs unless explicitly approved.
- Log prompts/responses with redaction where possible.
