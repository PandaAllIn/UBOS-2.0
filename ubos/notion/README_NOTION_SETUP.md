# Notion Workspace Setup (EUFM)

This guide sets up a clean, reliable Notion workspace structure and fixes the prior API issues.

## 1) Prerequisites
- Create a Notion internal integration in Notion → Settings → Integrations.
- Copy the integration token and keep it safe.
- In Notion, create or choose a parent page where all EUFM databases will live (e.g., “EUFM Control Center”).
- Share that parent page with your integration (via Share → Invite → select your integration → Can Edit).

## 2) Environment variables
Copy `.env.example` to `.env` and fill in:

```
NOTION_TOKEN=secret_xxx
NOTION_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Never commit real tokens. If a token was ever committed, rotate it now in Notion.

## 3) What the scripts will create
- 📊 Projects Master Database (title property: Name)
- 🤖 Agents Activity Database (relates to Projects)
- 💰 Client Pipeline Database
- 🇪🇺 EU Funding Opportunities Database (relates to Projects)
- 🏛️ Oradea Partnerships Database

Each is created under `NOTION_PARENT_PAGE_ID`. Relations point to Projects.

## 4) Commands
Run with Node 18+.

- Create databases:
```
node notion/create_databases.mjs
```
- Verify schema (prints properties and their IDs):
```
node notion/verify_schema.mjs
```
- Populate Projects with initial entries:
```
node notion/populate_projects.mjs
```

## 5) Important notes
- Title property in Notion is always the special property with id `title`. Use the visible name `Name` when creating pages, or use the property ID.
- The previous errors came from using a custom title name (e.g., “Project Name”). The API normalizes the title to `Name`. The new scripts use `Name` to avoid mismatch.
- If you change property names in the UI, re-run `verify_schema` to see current mappings.

## 6) Optional: Top-level dashboard page
On your parent page:
- Add linked views for each database with useful default filters/sorts (e.g., Projects by Status, Funding by Deadline, Clients by Probability).
- Create a summary section with rollups and quick links.

## 7) Troubleshooting
- 404 or not found: Ensure the parent page is shared with the integration.
- Validation “property does not exist”: Run `verify_schema` and use the exact property name or ID printed.
- Rate limits: Retry with backoff; Pro plans reduce this issue.

