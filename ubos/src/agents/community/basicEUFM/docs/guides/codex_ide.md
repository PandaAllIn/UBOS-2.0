# Codex IDE (OpenAI Codex Extension)

Codex is OpenAI’s coding agent that can read, modify, and run code locally in your IDE, and also run larger tasks in the cloud.

## Install & sign-in
- Install the extension for Cursor (works with VS Code forks).
- Sign in with your ChatGPT Plus/Pro/Team/Edu/Enterprise account. Alternatively, configure an API key via the Codex CLI for advanced setups.

## Approval modes
- Agent (default): can read files, edit, and run commands in the working directory. Network or outside-of-repo actions require your approval.
- Chat: no edits/commands; use for planning or Q&A.
- Agent (Full Access): can read/edit/run with network and outside-of-repo access. Use only when necessary and with caution.

## Cloud delegation
- You can offload jobs to a Codex cloud environment. Start from local context, choose Run in the cloud, and track progress in the side panel. Bring results back locally to test and iterate.

## EUFM project playbook
- Working directory: `<repo-root>`
- Preferred mode: Agent (default) for most tasks. Approve network access only when fetching external docs or dependencies.
- Safe commands: docs generation, lint checks, link checks, README updates. Avoid destructive git operations without a branch.
- Branching: when delegating to cloud, prefer off-main branches.

### Common tasks
- “Generate docs index or update tool links” → let Codex scan `docs/` and propose diffs.
- “Create skeleton for CI” → Codex can add `.github/workflows/ci.yml` with docs-link checks.
- “Refactor doc structure” → have Codex move/rename files; review the diff.

## References
- Extension/CLI: https://github.com/openai/codex
- Works on macOS/Linux; Windows via WSL recommended.
