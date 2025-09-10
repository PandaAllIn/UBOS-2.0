## UBOS Repo Housekeeping

This document tracks maintenance tasks and repo meta-configuration.

- CI: GitHub Actions workflow is added at `.github/workflows/ci.yml` to run typecheck, EUFM tests, UBOS tests, and build the consultant portal.
- Large files: GitHub warned about a historical large file `google-cloud-cli-darwin-x86_64.tar.gz` (>50MB). For future safety:
  - Option A: Set up Git LFS and track archives: `git lfs install && git lfs track "*.tar.gz" && git add .gitattributes && git commit -m "chore: track archives with LFS"`.
  - Option B: Purge history with `git filter-repo` or BFG to remove the blob permanently (requires force-push). Open a PR to coordinate.
- Branch protection (suggested): Enable on `main` with required checks (CI), linear history, and PR reviews.
- Secrets (CI): If future steps need provider keys, add repository secrets (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`). Current CI does not call external APIs.
- Docs: Path references now use `<repo-root>` instead of absolute local paths.

