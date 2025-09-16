# n8n

**Category**: productivity  
**Priority**: medium
**Research Model**: sonar-pro
**Confidence**: 95%
**Research Cost**: $0.0017
**Processing Time**: 25 seconds
**Generated**: 2025-09-12T18:29:25.410Z

---

**n8n** is a powerful, extensible workflow automation tool that enables users to connect APIs, automate business processes, and build integrations with minimal or no code. Below is comprehensive documentation tailored for developers and technical teams.

---

## 1. Overview & Purpose

**n8n** (pronounced "n-eight-n") is an open-source, fair-code licensed workflow automation platform. Its primary purpose is to let users automate tasks by connecting different services, APIs, and databases through visual workflows. n8n is used for:

- **Automating repetitive business processes** (e.g., data syncing, notifications, ETL)
- **Integrating SaaS tools** (e.g., Slack, Google Sheets, GitHub)
- **Building custom automations** for internal tools or customer-facing services
- **Orchestrating AI workflows** (e.g., connecting to OpenAI, Gemini, or other LLMs)[3][2]

---

## 2. Installation & Setup

**n8n** can be run in the cloud, locally, or self-hosted. Choose the method that fits your needs:

### a. Cloud (Recommended for Quick Start)
- Sign up at the official n8n Cloud: [n8n.io](https://n8n.io)
- No installation required; managed hosting, updates, and scaling.

### b. Docker (Recommended for Production/Self-Hosting)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```
- Access the UI at `http://localhost:5678`

### c. npm (For Local Development)
```bash
npm install n8n -g
n8n start
```
- Access the UI at `http://localhost:5678`

### d. Other Platforms
- n8n supports deployment on Kubernetes, cloud VMs, and more. See the [official docs][3] for platform-specific guides.

---

## 3. Core Features

- **Visual Workflow Editor:** Drag-and-drop interface to build workflows.
- **Extensive Node Library:** 350+ prebuilt integrations for popular apps and protocols.
- **Custom Node Support:** Build and add your own nodes.
- **Conditional Logic:** IF, SWITCH, and other control nodes for complex flows.
- **Scheduling & Triggers:** Webhooks, cron jobs, polling, and event-based triggers.
- **Data Transformation:** Built-in functions for manipulating data between nodes.
- **Credential Management:** Securely store and reuse API keys, OAuth tokens, etc.
- **Execution Modes:** Manual, scheduled, or event-driven execution.
- **AI Integration:** Native support for OpenAI, Gemini, and other LLMs[2][3][4].

---

## 4. Usage Examples

### a. Simple Workflow: HTTP Trigger → Send Email

1. **Add HTTP Trigger Node:** Starts the workflow on HTTP request.
2. **Add Email Node:** Sends an email using SMTP credentials.
3. **Connect Nodes:** Drag from HTTP Trigger output to Email input.

### b. AI Chatbot Workflow

```plaintext
[Chat Trigger] → [AI Agent Node] → [OpenAI Chat Model]
```
- Configure the AI Agent node to use your OpenAI credentials.
- The workflow responds to chat input with AI-generated replies[2].

### c. Example: Fetch Data from API and Store in Google Sheets

1. **HTTP Request Node:** Fetch data from an external API.
2. **Google Sheets Node:** Append data to a spreadsheet.
3. **Connect and map fields** in the visual editor.

---

## 5. API Reference

### a. REST API (for workflow management)
- **GET /rest/workflows**: List workflows
- **POST /rest/workflows**: Create workflow
- **GET /rest/executions**: List executions
- **POST /rest/webhook/{id}**: Trigger workflow via webhook

### b. CLI Commands
```bash
n8n start                # Start n8n in interactive mode
n8n export:workflow      # Export workflows to file
n8n import:workflow      # Import workflows from file
n8n user:add             # Add a new user (self-hosted)
```
See [CLI documentation][3] for full command list.

---

## 6. Integration Guide

- **Prebuilt Integrations:** Use the node library to add services like Slack, GitHub, Airtable, etc.
- **Custom API Integration:** Use the HTTP Request node to connect to any REST API.
- **Webhooks:** Use the Webhook node to receive external events and trigger workflows.
- **AI Models:** Add AI Agent nodes and connect to OpenAI, Gemini, or other supported models[2].
- **Chaining Workflows:** Use the Execute Workflow node to call other workflows modularly.

---

## 7. Configuration

### a. Environment Variables (Self-hosted)
- `N8N_BASIC_AUTH_ACTIVE=true` — Enable basic auth
- `N8N_BASIC_AUTH_USER=admin`
- `N8N_BASIC_AUTH_PASSWORD=yourpassword`
- `N8N_PORT=5678` — Set custom port

### b. Credentials Management
- Store API keys, OAuth tokens, and secrets securely in the Credentials section.
- Credentials are encrypted at rest.

### c. Authentication
- Cloud: Managed by n8n.
- Self-hosted: Use environment variables for admin access, or integrate with SSO/OAuth.

---

## 8. Troubleshooting

- **Port Already in Use:** Change `N8N_PORT` or stop conflicting service.
- **Workflow Not Triggering:** Check trigger node configuration and webhook URLs.
- **Node Fails with Error:** Review node logs and input data; validate credentials.
- **Permission Issues:** Ensure correct file permissions for persistent storage (`~/.n8n`).
- **Upgrade Issues:** Backup workflows and credentials before upgrading; review breaking changes in release notes[3][4].

---

## 9. Best Practices

- **Modular Workflows:** Break complex automations into smaller, reusable workflows.
- **Version Control:** Export and store workflows in Git for change tracking.
- **Credential Hygiene:** Use environment variables and restrict access to sensitive data.
- **Testing:** Use manual execution and the Executions list to debug workflows[5].
- **Documentation:** Use workflow description fields and automated documentation workflows[1][7].
- **Error Handling:** Add error triggers and notifications for failed executions.

---

## 10. Resources

- **Official Documentation:** [docs.n8n.io][3]
- **Workflow Templates:** [n8n.io/workflows][5]
- **Community Forum:** [community.n8n.io]
- **GitHub Repository:** [github.com/n8n-io][6]
- **Tutorials & Courses:** [docs.n8n.io/courses][4]
- **Automated Documentation Workflow:** [Auto-document your n8n workflows][1]

---

**Note:** For the most up-to-date and detailed information, always refer to the [official n8n documentation][3].

---

**Metadata**:
- Content Length: 6156 characters
- Tokens Used: 1,723
- Sources Found: 3

*Generated by UBOS 2.0 Enhanced Tool Documentation Agent*
*Powered by Perplexity Sonar API*
