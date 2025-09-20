# Usage Limits and Quotas

The agent tracks usage against typical metrics: messages, requests, and tokens. The exact metrics and limits vary per provider.

Metrics glossary:
- messages: Chat‑style interactions in web UIs.
- requests: API calls or discrete queries.
- tokens: Sum of input + output tokens for API usage (approx.).

Indicative limits by tier (subject to change):

ChatGPT
- Free: ~30 messages/day (capacity based).
- Plus: ~80 messages/day (dynamic; higher during off‑peak).

Claude
- Free: ~25 messages/day.
- Pro: ~100 messages/day (varies by model/usage).

Perplexity
- Free: ~50 requests/day.
- Pro: ~300 requests/day.

Abacus.ai
- Free/Trial: ~2M tokens/month credits.
- Pro: ~10M tokens/month (example; consult pricing).
- Enterprise: Custom.

Fetching latest limits:
- The CLI runs best‑effort web checks to confirm plan pages are reachable.
- Since vendors frequently adjust limits and don’t expose machine‑readable caps, the agent uses conservative defaults and reports the source for transparency.

