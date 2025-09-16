# Perplexity Pro

**Category**: ai_platform  
**Priority**: medium
**Research Model**: sonar-pro
**Confidence**: 95%
**Research Cost**: $0.0020
**Processing Time**: 26 seconds
**Generated**: 2025-09-12T18:27:48.312Z

---

**Perplexity Pro** is a premium AI-powered research and search platform designed for developers, researchers, and professionals who need advanced, real-time information retrieval, reasoning, and integration capabilities. Below is comprehensive documentation to help you get started and make the most of Perplexity Pro.

---

## 1. Overview & Purpose

**Perplexity Pro** delivers advanced AI search, reasoning, and content generation by combining proprietary and leading third-party models (e.g., Sonar, GPT-5, Claude 4.0 Sonnet, Gemini 2.5 Pro)[2]. Its core value is **real-time, citation-backed answers**—making it ideal for:

- **Research**: In-depth, source-cited reports and literature reviews.
- **Data Analysis**: Upload and analyze files (PDFs, CSVs, images, audio, video).
- **Content Generation**: Draft reports, code, spreadsheets, and even simple web apps.
- **Integration**: Embed advanced search and reasoning into your own applications via API[1][2].

---

## 2. Installation & Setup

### Web Platform

- Visit the official site and sign up for a Perplexity account.
- Upgrade to Pro via the subscription page (supports credit/debit cards, PayPal, Apple Pay, Google Pay, ACH, Cash App)[1][2].
- Access Pro features immediately after payment.

### API Access

1. **Register/Login**: Create or log in to your Perplexity account.
2. **API Dashboard**: Navigate to the API settings page.
3. **Payment**: Add a payment method and purchase API credits (Pro users get $5/month in credits)[1][2].
4. **API Key**: Generate and securely store your API key from the dashboard[1].

### Mobile Apps

- Download the Perplexity app from the iOS App Store or Google Play.
- Log in with your Pro account for premium features.

---

## 3. Core Features

- **Pro Search**: Deep, multi-source answers with citations using advanced models (Sonar, GPT-5, Claude 4.0 Sonnet, Gemini 2.5 Pro)[2].
- **Reasoning Search**: Handles complex, multi-step analytical queries (o3, Claude 4.0 Sonnet Thinking, Grok4)[2].
- **Best Mode**: Automatically selects the optimal model for your query[2].
- **Research Mode**: Generates comprehensive, multi-model research reports[2].
- **Labs**: Automates complex projects (reports, dashboards, web apps)[2].
- **File Analysis**: Upload and analyze PDFs, CSVs, images, audio, and video[2].
- **Image/Video Generation**: Create media using the latest generative models[2].
- **API Access**: Integrate Perplexity’s models into your own apps with RESTful endpoints[1].
- **Custom Instructions**: Personalize AI behavior across all conversations[3].
- **Pro Support**: Priority Discord and Intercom support[2].

---

## 4. Usage Examples

### Web UI

- **Switching Models**: Use the search box dropdown to select between Sonar, GPT-5, Claude, Gemini, etc.[2].
- **File Upload**: Drag and drop files for instant analysis.
- **Labs**: Start a new project from the Labs section for advanced automation.

### API (Python Example)

```python
from openai import OpenAI

YOUR_API_KEY = "INSERT_API_KEY"
client = OpenAI(api_key=YOUR_API_KEY, base_url="https://api.perplexity.ai")

response = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Summarize the latest research on quantum computing."}
    ]
)
print(response.choices[0].message.content)
```
[1]

### cURL Example

```bash
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar-pro",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```
[1]

---

## 5. API Reference

### Base URL

```
https://api.perplexity.ai
```

### Main Endpoint

- **POST /chat/completions**  
  - **Parameters**:
    - `model`: Model name (e.g., "sonar-pro", "sonar-medium", "gpt-5", etc.)
    - `messages`: List of message objects (`role`: "system" | "user" | "assistant", `content`: string)
    - Optional: `temperature`, `max_tokens`, etc. (OpenAI-compatible)[1]
  - **Authentication**: Bearer token in `Authorization` header.

### Models

| Model Name         | Description                                 |
|--------------------|---------------------------------------------|
| sonar-pro          | Flagship, advanced search & reasoning       |
| sonar-small/medium | Efficient, basic info retrieval             |
| mistral-7b         | Open-source, balanced tasks                 |
| codellama-34b      | Code-focused                                |
| llama-2-70b        | Large, broad knowledge                      |
| gpt-5, claude-4.0, gemini-2.5 | Third-party, advanced reasoning  |

---

## 6. Integration Guide

- **OpenAI Client Compatibility**: Use OpenAI libraries by specifying the `base_url` as `https://api.perplexity.ai`[1].
- **Environment Variables**: Store API keys securely (e.g., `PERPLEXITY_API_KEY`).
- **Webhooks**: For advanced workflows, poll or subscribe to responses as needed.
- **File Analysis**: Use the web UI or API endpoints (where available) to upload and process files.

---

## 7. Configuration

- **API Key Management**: Generate, rotate, and revoke keys in the dashboard[1].
- **Environment Setup**:
  - Set `PERPLEXITY_API_KEY` in your environment.
  - For Python: `export PERPLEXITY_API_KEY=your_key`
- **Authentication**: Always use HTTPS and Bearer tokens.
- **Custom Instructions**: Set in your profile for consistent AI behavior[3].

---

## 8. Troubleshooting

| Issue                          | Solution                                                                 |
|---------------------------------|--------------------------------------------------------------------------|
| Invalid API Key                 | Regenerate key in dashboard, check for typos                             |
| 401 Unauthorized                | Ensure Bearer token is correct and not expired                           |
| Rate Limits/Quota Exceeded      | Check usage in dashboard, upgrade plan or wait for reset                 |
| Model Not Found                 | Verify model name, check Pro subscription status                         |
| File Upload Fails               | Ensure file type/size is supported, try via web UI                       |
| No Response/Timeout             | Check network, retry, or contact Pro support via Discord/Intercom[2]     |

---

## 9. Best Practices

- **API Key Security**: Never expose keys in client-side code or public repos[1].
- **Model Selection**: Use Sonar for most advanced needs; switch to third-party models for specific tasks[2].
- **Prompt Engineering**: Use clear, specific instructions for best results.
- **Data Privacy**: Exclude sensitive data from uploads; review privacy settings[3].
- **Key Rotation**: Regularly rotate API keys and monitor usage[1].
- **Subscription Management**: Cancel Pro before deleting your account to avoid billing issues[2].

---

## 10. Resources

- **Official Documentation**:  
  - [Perplexity Help Center][2]
  - [API Guide][1]
- **Community**:  
  - Pro Discord channel (invite via account menu)[2]
- **Tutorials & Guides**:  
  - [Beginner’s Guide][3]
  - [Getting Started][4]
- **Support**:  
  - Intercom (via settings page for Pro users)[2]

---

**Note:** For the latest features, model availability, and API changes, always refer to the official Perplexity documentation and your account dashboard[1][2].

---

**Metadata**:
- Content Length: 7533 characters
- Tokens Used: 1,985
- Sources Found: 4

*Generated by UBOS 2.0 Enhanced Tool Documentation Agent*
*Powered by Perplexity Sonar API*
