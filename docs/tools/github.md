# GitHub

Purpose: Version control, collaboration, issues/PRs, webhooks, and CI triggers.

## Official docs
- Docs home: https://docs.github.com/en
- REST API v3: https://docs.github.com/en/rest
- GraphQL API v4: https://docs.github.com/en/graphql
- Webhooks & events: https://docs.github.com/en/webhooks-and-events
- Octokit SDKs: https://github.com/octokit

## Auth
- Personal access token (classic or fine-grained)
- GitHub App (recommended for automation)

## Notes for integration
- Prefer GitHub Apps for scoped, revocable auth and higher rate limits
- Use REST for actions on repos/issues; use GraphQL for efficient complex reads
- Webhooks: subscribe to `issues`, `pull_request`, `workflow_job`, `check_run`

## Minimal REST example
- Base URL: `https://api.github.com`
- Accept header often required for previews; set API version where applicable

## Rate limits
- REST and GraphQL have separate quotas; Apps have per-installation limits
