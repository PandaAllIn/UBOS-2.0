# GitHub Swarm

**Category**: development  
**Priority**: medium
**Research Model**: sonar-pro
**Confidence**: 95%
**Research Cost**: $0.0014
**Processing Time**: 34 seconds
**Generated**: 2025-09-12T18:31:40.516Z

---

**GitHub Swarm** is an experimental, educational Python framework by OpenAI for orchestrating multi-agent AI systems. It enables developers to define, coordinate, and execute multiple AI agents that can interact, hand off tasks, and collaborate on complex workflows[3][5].

---

## 1. Overview & Purpose

**Swarm** is designed to make **agent coordination and execution lightweight, controllable, and testable**. Its main use cases include:

- Prototyping multi-agent AI workflows
- Researching agent collaboration and handoff strategies
- Educational exploration of agent-based architectures
- Building demos or proof-of-concept systems where multiple AI agents interact[3][5]

**Note:** Swarm is experimental and has been superseded by the OpenAI Agents SDK for production use[3].

---

## 2. Installation & Setup

**Requirements:** Python 3.10+

**Install via pip:**
```bash
pip install git+https://github.com/openai/swarm.git
```
or (using SSH)
```bash
pip install git+ssh://git@github.com/openai/swarm.git
```
[3]

**API Key Setup:**
- Set the `OPENAI_API_KEY` environment variable with your OpenAI API key.
- Alternatively, create a `.env` file in your project root:
  ```
  OPENAI_API_KEY=your-api-key-here
  ```
[1]

---

## 3. Core Features

- **Agent Definition:** Easily define agents with custom instructions and functions.
- **Agent Handoff:** Agents can transfer control or context to other agents.
- **Lightweight Orchestration:** Minimal setup for running and coordinating agents.
- **Streaming Support:** Supports streaming responses for interactive applications.
- **REPL Demo Loop:** Built-in REPL for rapid prototyping and testing[3][4].

---

## 4. Usage Examples

**Basic Multi-Agent Orchestration:**
```python
from swarm import Swarm, Agent

def transfer_to_agent_b():
    return agent_b

agent_a = Agent(
    name="Agent A",
    instructions="You are a helpful agent.",
    functions=[transfer_to_agent_b],
)

agent_b = Agent(
    name="Agent B",
    instructions="Only speak in Haikus.",
)

client = Swarm()
response = client.run(
    agent=agent_a,
    messages=[{"role": "user", "content": "I want to talk to agent B."}],
)

print(response.messages[-1]["content"])
# Output: (Haiku from Agent B)
```
[3][4]

**REPL Demo Loop:**
```python
from swarm.repl import run_demo_loop
run_demo_loop(agent_a, stream=True)
```
[3]

---

## 5. API Reference

### Python Classes & Methods

| Class/Function         | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `Swarm()`              | Main client for running agent workflows                          |
| `Agent(name, instructions, functions)` | Defines an agent with a name, instructions, and callable functions |
| `Swarm.run(agent, messages)` | Runs a conversation/workflow starting with the given agent and messages |
| `run_demo_loop(agent, stream=True)` | Starts an interactive REPL for agent testing           |

---

## 6. Integration Guide

- **OpenAI API:** Swarm uses your OpenAI API key for all agent interactions.
- **Other Providers:** You can adapt Swarm to use other LLM providers (e.g., Anthropic, Gemini) by setting the appropriate API key and modifying agent logic[1].
- **Python Ecosystem:** Swarm agents can call any Python function, enabling integration with databases, APIs, or other tools.

---

## 7. Configuration

- **Environment Variables:**  
  - `OPENAI_API_KEY`: Your OpenAI API key (required)[1].
- **.env File:**  
  - Place a `.env` file in your project root with the key-value pair above.
- **Agent Instructions:**  
  - Each agent can be configured with unique instructions and callable functions.
- **Streaming:**  
  - Enable streaming in REPL or API calls for real-time responses.

---

## 8. Troubleshooting

| Issue                                 | Solution                                                                 |
|----------------------------------------|--------------------------------------------------------------------------|
| ImportError / ModuleNotFoundError      | Ensure Python 3.10+ and correct pip install command[3].                  |
| API Key Not Found                     | Set `OPENAI_API_KEY` as an environment variable or in `.env` file[1].    |
| Unexpected Agent Behavior              | Check agent instructions and function definitions for logic errors.       |
| No Output / Hanging                    | Verify API connectivity and that your key is valid and has quota.         |

---

## 9. Best Practices

- **Use Clear Agent Instructions:** Define concise, role-specific instructions for each agent.
- **Limit Agent Functions:** Only expose necessary functions to each agent for security and clarity.
- **Test in REPL:** Use the built-in REPL (`run_demo_loop`) for rapid prototyping and debugging[3].
- **Migrate to Agents SDK for Production:** For robust, production-grade systems, use the newer OpenAI Agents SDK[3].
- **Version Control .env Files Carefully:** Do not commit API keys to public repositories.

---

## 10. Resources

- **Official Repository:** [openai/swarm on GitHub][3]
- **Cookbook & Examples:** [The-Swarm-Corporation/Cookbook][1]
- **Community Discussions:** OpenAI Community Forum[5]
- **Video Tutorials:** YouTube walkthroughs (e.g., "Build Anything with OpenAI Swarm")[4]
- **Node.js SDK:** For JavaScript/Node.js, see Swarm.js (community implementation)[2]

---

**Note:** Swarm is experimental and not officially supported for production. For long-term projects, migrate to the OpenAI Agents SDK[3][5].

---

**Metadata**:
- Content Length: 5591 characters
- Tokens Used: 1,446
- Sources Found: 1

*Generated by UBOS 2.0 Enhanced Tool Documentation Agent*
*Powered by Perplexity Sonar API*
