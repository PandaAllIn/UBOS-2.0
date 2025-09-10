# Browser-Capable Agent Design

## Goals
- Let agents operate web UIs for tools lacking clean APIs
- Preserve security and auditability

## Approaches
- Headless browser (Playwright) with policy-guarded actions
- Native APIs preferred; browser falls back for gaps
- DOM tool wrappers ("click", "type", "waitFor", "download")

## Safety
- Domain allowlist, selector allowlist, network egress control
- Screenshot + action logs for review

## Credentials
- Use delegated, short-lived tokens; do not embed credentials in prompts

## Observability
- Store session replays and structured action logs
