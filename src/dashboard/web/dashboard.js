// EUFM Mission Control Dashboard
class MissionControlDashboard {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000;
        this.initTime = new Date();
        this.init();
    }

    init() {
        this.updateTimestamp();
        this.updateInitTime();
        this.setupEventListeners();
        this.loadInitialData();
        
        // Update timestamp every second
        setInterval(() => this.updateTimestamp(), 1000);
        setInterval(() => this.updateUptime(), 1000);
        
        // Refresh data every 30 seconds
        setInterval(() => this.loadInitialData(), 30000);
    }

    updateTimestamp() {
        const now = new Date();
        document.getElementById('timestamp').textContent = 
            now.toLocaleString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });
    }

    updateInitTime() {
        document.getElementById('init-time').textContent = 
            this.initTime.toLocaleTimeString();
    }

    updateUptime() {
        const uptime = Date.now() - this.initTime.getTime();
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('uptime').textContent = `Uptime: ${hours}h ${minutes}m`;
    }

    setupEventListeners() {
        // Modal handling
        const modal = document.getElementById('task-modal');
        const closeBtn = modal.querySelector('.close');
        
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    async loadInitialData() {
        try {
            // Simulate API calls - in real implementation, these would be actual API endpoints
            await this.updateSystemOverview();
            await this.updateProjectStatus();
            await this.updateAgentStatus();
            await this.updateToolStatus();
            await this.updateSubscriptionUsage();
            await this.updateFundingOpportunities();
            await this.updateActivityFeed();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.addChatMessage('system', 'Warning: Failed to load some dashboard data');
        }
    }

    async updateSystemOverview() {
        // Simulate system metrics
        const metrics = {
            activeAgents: Math.floor(Math.random() * 5) + 1,
            completedTasks: Math.floor(Math.random() * 50) + 25,
            memoryNotes: 18, // From our actual knowledge base
            totalCost: (Math.random() * 10 + 5).toFixed(2)
        };

        document.getElementById('active-agents').textContent = metrics.activeAgents;
        document.getElementById('completed-tasks').textContent = metrics.completedTasks;
        document.getElementById('memory-notes').textContent = metrics.memoryNotes;
        document.getElementById('total-cost').textContent = `$${metrics.totalCost}`;
    }

    async updateProjectStatus() {
        const status = {
            phase: 'Mission Control Development',
            progress: 85,
            nextMilestone: 'EU Funding Application Submission',
            fundingCount: Math.floor(Math.random() * 8) + 3
        };

        document.getElementById('project-phase').textContent = status.phase;
        document.getElementById('progress-fill').style.width = `${status.progress}%`;
        document.querySelector('.progress-text').textContent = `${status.progress}% Complete`;
        document.getElementById('next-milestone').textContent = `Next: ${status.nextMilestone}`;
        document.getElementById('funding-count').textContent = status.fundingCount;
    }

    async updateAgentStatus() {
        const agents = [
            { name: 'CodexAgent', status: 'online', lastUsed: '2 min ago' },
            { name: 'JulesAgent', status: 'online', lastUsed: '5 min ago' },
            { name: 'AbacusAgent', status: 'limited', lastUsed: '1 hour ago' },
            { name: 'BrowserAgent', status: 'online', lastUsed: '10 min ago' },
            { name: 'MemoryAgent', status: 'online', lastUsed: '1 min ago' }
        ];

        const agentList = document.getElementById('agent-list');
        agentList.innerHTML = agents.map(agent => `
            <div class="agent-item">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-details">
                    <span class="agent-status status-${agent.status}">${agent.status}</span>
                    <span class="agent-last-used">${agent.lastUsed}</span>
                </div>
            </div>
        `).join('');
    }

    async updateToolStatus() {
        const tools = [
            { name: 'OpenAI', status: 'online' },
            { name: 'Anthropic', status: 'online' },
            { name: 'Gemini', status: 'online' },
            { name: 'Perplexity', status: 'online' },
            { name: 'Codex CLI', status: 'online' },
            { name: 'Obsidian', status: 'online' },
            { name: 'GitHub', status: 'online' },
            { name: 'Abacus.AI', status: 'limited' }
        ];

        const toolGrid = document.getElementById('tool-grid');
        toolGrid.innerHTML = tools.map(tool => `
            <div class="tool-item">
                <div class="tool-name">${tool.name}</div>
                <div class="tool-status status-${tool.status}">${tool.status}</div>
            </div>
        `).join('');
    }

    async updateSubscriptionUsage() {
        const subscriptions = [
            { name: 'ChatGPT Plus', usage: 45, status: 'ok' },
            { name: 'Claude Pro', usage: 32, status: 'ok' },
            { name: 'Perplexity Pro', usage: 67, status: 'warning' },
            { name: 'Abacus.AI Pro', usage: 23, status: 'ok' }
        ];

        const subscriptionList = document.getElementById('subscription-list');
        subscriptionList.innerHTML = subscriptions.map(sub => `
            <div class="subscription-item">
                <div class="subscription-header">
                    <div class="subscription-name">${sub.name}</div>
                    <div class="subscription-usage">${sub.usage}% used</div>
                </div>
                <div class="usage-bar">
                    <div class="usage-fill usage-${sub.status}" style="width: ${sub.usage}%"></div>
                </div>
            </div>
        `).join('');
    }

    async updateFundingOpportunities() {
        // Simulate funding opportunities
        const opportunities = [
            {
                title: 'Horizon Europe: Digital and emerging technologies',
                program: 'Horizon Europe',
                deadline: '2024-12-15',
                status: 'open'
            },
            {
                title: 'Digital Europe Programme: AI Excellence',
                program: 'Digital Europe',
                deadline: '2024-11-30',
                status: 'closing_soon'
            },
            {
                title: 'EIC Accelerator: Deep Tech Innovation',
                program: 'EIC',
                deadline: '2025-01-20',
                status: 'open'
            }
        ];

        const opportunityList = document.getElementById('opportunity-list');
        opportunityList.innerHTML = opportunities.map(opp => `
            <div class="opportunity-item">
                <div class="opportunity-title">${opp.title}</div>
                <div class="opportunity-program">${opp.program}</div>
                <div class="opportunity-deadline">Deadline: ${opp.deadline}</div>
            </div>
        `).join('');
    }

    async updateActivityFeed() {
        const activities = [
            'Strategic Orchestrator analyzed new task',
            'MemoryAgent loaded 18 knowledge base notes',
            'Perplexity Sonar completed research query',
            'CodexAgent generated TypeScript utility',
            'System optimization suggestions updated'
        ];

        const activityList = document.getElementById('activity-list');
        const now = new Date();
        
        activityList.innerHTML = activities.map((activity, index) => {
            const time = new Date(now.getTime() - (index * 5 * 60 * 1000));
            return `
                <div class="activity-item">
                    <div class="activity-content">${activity}</div>
                    <div class="activity-time">${time.toLocaleTimeString()}</div>
                </div>
            `;
        }).join('');
    }

    addChatMessage(type, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Global functions for UI interactions
function executeTask() {
    document.getElementById('task-modal').style.display = 'block';
}

function submitTask(dryRun = false) {
    const taskInput = document.getElementById('task-input').value;
    if (!taskInput.trim()) return;

    const mode = dryRun ? 'Dry Run' : 'Execute';
    dashboard.addChatMessage('user', `${mode}: ${taskInput}`);
    dashboard.addChatMessage('system', `Task queued for ${mode.toLowerCase()}...`);
    
    // Simulate task execution
    setTimeout(() => {
        dashboard.addChatMessage('system', `Task ${dryRun ? 'analyzed' : 'completed'} successfully`);
    }, 2000);

    document.getElementById('task-modal').style.display = 'none';
    document.getElementById('task-input').value = '';
}

async function scanFunding() {
    dashboard.addChatMessage('system', 'Starting EU funding opportunity scan...');
    
    // Simulate scanning
    setTimeout(() => {
        dashboard.addChatMessage('system', 'Found 12 new funding opportunities');
        dashboard.updateFundingOpportunities();
    }, 3000);
}

function generateReport() {
    dashboard.addChatMessage('system', 'Generating comprehensive system report...');
    setTimeout(() => {
        dashboard.addChatMessage('system', 'Report generated and saved to logs/reports/');
    }, 2000);
}

function optimizeSystem() {
    dashboard.addChatMessage('system', 'Running system optimization analysis...');
    setTimeout(() => {
        dashboard.addChatMessage('system', 'Optimization suggestions updated - check analytics:optimize');
    }, 2500);
}

function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    dashboard.addChatMessage('user', message);
    input.value = '';
    
    // Simulate system response
    setTimeout(() => {
        if (message.toLowerCase().includes('status')) {
            dashboard.addChatMessage('system', 'System status: All agents operational, 85% project completion');
        } else if (message.toLowerCase().includes('funding')) {
            dashboard.addChatMessage('system', 'Found 3 active funding opportunities matching EUFM criteria');
        } else {
            dashboard.addChatMessage('system', `Command processed: ${message}`);
        }
    }, 1000);
}

// Initialize dashboard when page loads
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new MissionControlDashboard();
});
