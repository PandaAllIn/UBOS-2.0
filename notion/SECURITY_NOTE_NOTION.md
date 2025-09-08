# Security Note: Notion Token

- A Notion integration token was previously committed in repository files.
- Treat it as compromised. Immediately rotate the token in Notion → Integrations.
- After rotation, update `.env` with the new token and delete any hardcoded tokens.
- Use only the env-based scripts under `notion/` going forward.

Files that previously contained hardcoded tokens (rotate before any reuse):
- `create_notion_dbs.mjs`
- `populate_notion.mjs`
- `consolidated_setup.mjs`
- `simple_test.mjs`
- `update_schema.mjs`
- `get_schema.mjs`
- `delete_databases.mjs`

To sanitize: either remove those files or replace their contents to import the token from env.

