// Claude-Style EUFM Mission Control Dashboard
class EUFMDashboard {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.initTime = new Date();
    this.refreshInterval = 30000; // 30 seconds
    this.data = {
      projects: [],
      agents: [],
      deadlines: [],
      activities: [],
      funding: [],
      systemHealth: 98
    };
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateTimestamp();
    this.loadData();
    this.connectWebSocket();
    this.hideLoading();
    
    // Set up refresh intervals
    setInterval(() => this.updateTimestamp(), 1000);
    setInterval(() => this.refreshData(), this.refreshInterval);
  }

  bindEvents() {
    // Header buttons
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    const notionBtn = document.querySelector('.notion-link-btn');
    if (notionBtn) {
      notionBtn.addEventListener('click', () => this.openNotion());
    }
    const assistantBtn = document.getElementById('assistant-btn');
    if (assistantBtn) assistantBtn.addEventListener('click', () => this.openAssistant());

    // Alert action
    const alertAction = document.querySelector('.alert-action');
    if (alertAction) {
      alertAction.addEventListener('click', () => this.viewDeadlines());
    }

    // Funding actions
    const scanBtn = document.querySelector('.action-btn.primary');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.scanFunding());
    }

    const exportBtn = document.querySelector('.action-btn:not(.primary)');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportOpportunities());
    }

    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const label = e.currentTarget.querySelector('.quick-label').textContent;
        this.handleQuickAction(label);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.refreshData();
      }
      if (e.key.toLowerCase() === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.openAssistant();
      }
    });
  }

  async loadData() {
    this.showToast('🔄', 'Loading dashboard data...', 'info');
    
    try {
      // Load Notion parent link for buttons
      try {
        const cfg = await fetch('/api/notion/links').then(r=>r.ok?r.json():null).catch(()=>null);
        this.notionParentUrl = cfg?.parentUrl || 'https://www.notion.so';
      } catch {}

      // Load system status
      const statusResponse = await fetch('/api/status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        this.updateSystemStatus(status);
        this.populateRealData(status);
      } else {
        // Fallback to sample data
        this.populateSampleData();
      }

      // Load funding opportunities
      const fundingResponse = await fetch('/api/opportunities');
      if (fundingResponse.ok) {
        const funding = await fundingResponse.json();
        this.data.funding = funding;
        this.updateFundingDisplay();
      }

      this.renderDashboard();
      
      this.showToast('✅', 'Dashboard loaded successfully', 'success');
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showToast('❌', 'Failed to load some data', 'error');
      this.populateSampleData();
      this.renderDashboard();
    }
  }

  async askAssistant(message) {
    try {
      const msg = message || window.prompt('Ask the EUFM Assistant:');
      if (!msg) return;
      this.addActivity(`You: ${msg}`);
      const resp = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await resp.json();
      const reply = data?.reply || 'No response';
      this.addActivity(reply);
      this.showToast('🤖', 'Assistant responded', 'info');
    } catch {
      this.showToast('❌', 'Assistant unavailable', 'error');
    }
  }

  populateRealData(status) {
    // Use real data from the API response
    if (status.projects) {
      this.data.projects = status.projects.map(project => ({
        id: project.id,
        name: project.name || project.id,
        status: project.metrics?.healthScore >= 90 ? 'active' : 
                project.metrics?.healthScore >= 70 ? 'critical' : 'planned',
        health: project.metrics?.healthScore || 0,
        value: project.budget ? `€${(project.budget.allocated / 1000000).toFixed(1)}M` : 'N/A',
        icon: project.metrics?.healthScore >= 90 ? '🟢' : 
              project.metrics?.healthScore >= 70 ? '🟡' : 
              project.metrics?.healthScore > 0 ? '🔴' : '🔵'
      }));
    } else {
      this.populateSampleData();
      return;
    }

    // Real agent data
    if (status.agents) {
      this.data.agents = Object.entries(status.agents).map(([name, data]) => ({
        name: name,
        status: data.status || 'online',
        performance: data.performance || 'Active'
      }));
    } else {
      // Keep sample agents if no real data
      this.populateSampleAgents();
    }

    // Real system health
    this.data.systemHealth = status.systemHealth || 98;

    // Real activities from status
    if (status.recentActivities) {
      this.data.activities = status.recentActivities.slice(0, 10);
    } else {
      this.populateSampleActivities();
    }

    // Real deadlines (use sample for now as they're already seeded)
    this.populateCriticalDeadlines();
  }

  populateSampleData() {
    // Portfolio projects from registry
    this.data.projects = [
      {
        id: 'xf_production',
        name: 'XF Production',
        status: 'active',
        health: 98,
        value: '€6M',
        icon: '🟢'
      },
      {
        id: 'eufm_funding',
        name: 'EUFM EU Funding',
        status: 'critical',
        health: 92,
        value: '€2M Target',
        icon: '🔴'
      },
      {
        id: 'geo_data_center',
        name: 'GeoDataCenter',
        status: 'active',
        health: 80,
        value: '€10-50M',
        icon: '🟡'
      },
      {
        id: 'portal_oradea',
        name: 'Portal Oradea',
        status: 'planned',
        health: 0,
        value: '€950K Target',
        icon: '🔵'
      }
    ];

    // AI Agents
    this.data.agents = [
      { name: 'AgentSummoner', status: 'online', performance: '68s avg' },
      { name: 'Enhanced Abacus', status: 'online', performance: '22s avg' },
      { name: 'Codex CLI', status: 'online', performance: '90s tasks' },
      { name: 'Jules', status: 'online', performance: '45s queries' },
      { name: 'OradeaBusinessAgent', status: 'online', performance: 'Local partnerships' },
      { name: 'EUFundingProposal', status: 'online', performance: 'EU templates' },
      { name: 'CountryCodeValidator', status: 'online', performance: 'Compliance' },
      { name: 'SessionMemoryUpdater', status: 'online', performance: 'Context preservation' }
    ];

    // Critical deadlines
    this.data.deadlines = [
      {
        title: 'EUFM Funding Deadline',
        date: '2025-09-18',
        daysRemaining: 10,
        value: '€2M',
        urgency: 'critical'
      },
      {
        title: 'Horizon Europe Geothermal',
        date: '2025-09-02',
        daysRemaining: -6,
        value: '€50M',
        urgency: 'warning'
      },
      {
        title: 'CETPartnership Application',
        date: '2025-10-09',
        daysRemaining: 31,
        value: '€12M',
        urgency: 'info'
      }
    ];

    // Recent activities
    this.data.activities = [
      {
        icon: '🤖',
        title: 'AgentSummoner executed project analysis',
        time: '45 seconds ago'
      },
      {
        icon: '💰',
        title: 'Enhanced Abacus found new €15M geothermal opportunity',
        time: '2 minutes ago'
      },
      {
        icon: '📊',
        title: 'Codex CLI synced project data to Notion',
        time: '3 minutes ago'
      },
      {
        icon: '🎯',
        title: 'Jules optimized dashboard performance',
        time: '5 minutes ago'
      },
      {
        icon: '🔄',
        title: 'NotionSyncAgent completed 15-minute sync',
        time: '12 minutes ago'
      }
    ];
  }

  populateSampleAgents() {
    this.data.agents = [
      { name: 'AgentSummoner', status: 'online', performance: '68s avg' },
      { name: 'Enhanced Abacus', status: 'online', performance: '22s avg' },
      { name: 'Codex CLI', status: 'online', performance: '90s tasks' },
      { name: 'Jules', status: 'online', performance: '45s queries' },
      { name: 'OradeaBusinessAgent', status: 'online', performance: 'Local partnerships' },
      { name: 'EUFundingProposal', status: 'online', performance: 'EU templates' },
      { name: 'CountryCodeValidator', status: 'online', performance: 'Compliance' },
      { name: 'SessionMemoryUpdater', status: 'online', performance: 'Context preservation' }
    ];
  }

  populateSampleActivities() {
    this.data.activities = [
      {
        icon: '🤖',
        title: 'AgentSummoner executed project analysis',
        time: '45 seconds ago'
      },
      {
        icon: '💰',
        title: 'Enhanced Abacus found new €15M geothermal opportunity',
        time: '2 minutes ago'
      },
      {
        icon: '📊',
        title: 'Codex CLI synced project data to Notion',
        time: '3 minutes ago'
      },
      {
        icon: '🎯',
        title: 'Jules optimized dashboard performance',
        time: '5 minutes ago'
      },
      {
        icon: '🔄',
        title: 'NotionSyncAgent completed 15-minute sync',
        time: '12 minutes ago'
      }
    ];
  }

  populateCriticalDeadlines() {
    this.data.deadlines = [
      {
        title: 'EUFM Funding Deadline',
        date: '2025-09-18',
        daysRemaining: 10,
        value: '€2M',
        urgency: 'critical'
      },
      {
        title: 'Horizon Europe Geothermal',
        date: '2025-09-02',
        daysRemaining: -6,
        value: '€50M',
        urgency: 'warning'
      },
      {
        title: 'CETPartnership Application',
        date: '2025-10-09',
        daysRemaining: 31,
        value: '€12M',
        urgency: 'info'
      }
    ];
  }

  renderDashboard() {
    this.updatePortfolioStats();
    this.updateProjectsList();
    this.updateDeadlinesList();
    this.updateAgentGrid();
    this.updateActivityFeed();
    this.updateFundingCount();
  }

  updateSystemStatus(status) {
    const statusIndicator = document.getElementById('system-status');
    const statusText = statusIndicator?.querySelector('.status-text');
    const statusDot = statusIndicator?.querySelector('.status-dot');
    
    if (statusText && statusDot) {
      if (status && status.systemHealth >= 95) {
        statusText.textContent = 'System Operational';
        statusDot.style.background = 'var(--status-success)';
      } else if (status && status.systemHealth >= 80) {
        statusText.textContent = 'System Degraded';
        statusDot.style.background = 'var(--status-warning)';
      } else {
        statusText.textContent = 'System Issues';
        statusDot.style.background = 'var(--status-error)';
      }
    }

    // Update system health display
    const healthElement = document.getElementById('system-health');
    if (healthElement && status) {
      healthElement.textContent = `${status.systemHealth || 98}%`;
    }
  }

  updatePortfolioStats() {
    const activeProjectsEl = document.getElementById('active-projects');
    const systemHealthEl = document.getElementById('system-health');
    const revenueTargetEl = document.getElementById('revenue-target');

    if (activeProjectsEl) activeProjectsEl.textContent = this.data.projects.length;
    if (systemHealthEl) systemHealthEl.textContent = `${this.data.systemHealth}%`;
    if (revenueTargetEl) revenueTargetEl.textContent = '€950K+';
  }

  updateProjectsList() {
    const projectsList = document.getElementById('projects-list');
    if (!projectsList) return;

    projectsList.innerHTML = this.data.projects.map(project => `
      <div class="project-item">
        <div class="project-info">
          <div class="project-icon ${project.status}"></div>
          <div class="project-name">${project.name}</div>
        </div>
        <div class="project-health ${this.getHealthClass(project.health)}">${project.health}%</div>
      </div>
    `).join('');
  }

  updateDeadlinesList() {
    const deadlinesList = document.getElementById('deadlines-list');
    if (!deadlinesList) return;

    deadlinesList.innerHTML = this.data.deadlines.map(deadline => `
      <div class="deadline-item ${deadline.urgency}">
        <div class="deadline-info">
          <h4>${deadline.title}</h4>
          <div class="deadline-meta">${deadline.value} • ${deadline.date}</div>
        </div>
        <div class="deadline-urgency">
          <div class="days-remaining ${deadline.urgency}">${Math.abs(deadline.daysRemaining)}</div>
          <div class="urgency-label">${deadline.daysRemaining < 0 ? 'Days Past' : 'Days Left'}</div>
        </div>
      </div>
    `).join('');
  }

  updateAgentGrid() {
    const agentsGrid = document.getElementById('agents-grid');
    if (!agentsGrid) return;

    agentsGrid.innerHTML = this.data.agents.map(agent => `
      <div class="agent-item">
        <div class="agent-status"></div>
        <div class="agent-name">${agent.name}</div>
      </div>
    `).join('');
  }

  updateActivityFeed() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;

    activityList.innerHTML = this.data.activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-meta">${activity.time}</div>
        </div>
      </div>
    `).join('');
  }

  updateFundingDisplay() {
    const fundingCount = document.getElementById('funding-count');
    const fundingList = document.getElementById('funding-list');
    
    if (fundingCount) {
      fundingCount.textContent = `${this.data.funding.length}+`;
    }

    if (fundingList && this.data.funding.length > 0) {
      const limitedFunding = this.data.funding.slice(0, 5); // Show top 5
      fundingList.innerHTML = limitedFunding.map(opp => `
        <div class="funding-item">
          <div class="funding-title">${opp.title}</div>
          <div class="funding-meta">
            <span class="funding-budget">${opp.budget || 'Not specified'}</span>
            <span class="funding-deadline">${opp.deadline || 'No deadline'}</span>
          </div>
        </div>
      `).join('');
    }
  }

  updateFundingCount() {
    const fundingCountEl = document.getElementById('funding-count');
    if (fundingCountEl) {
      fundingCountEl.textContent = `${this.data.funding.length || 25}+`;
    }
  }

  getHealthClass(health) {
    if (health >= 90) return 'health-high';
    if (health >= 70) return 'health-medium';
    return 'health-low';
  }

  updateTimestamp() {
    const timestampEl = document.getElementById('timestamp');
    const lastUpdateEl = document.getElementById('last-update');
    const daysRemainingEl = document.getElementById('days-remaining');
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (timestampEl) timestampEl.textContent = timeStr;
    if (lastUpdateEl) lastUpdateEl.textContent = now.toLocaleString();
    
    // Update critical deadline countdown
    if (daysRemainingEl) {
      const deadline = new Date('2025-09-18');
      const diffTime = deadline - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysRemainingEl.textContent = `${diffDays} days`;
    }
  }

  async refreshData() {
    this.showToast('🔄', 'Refreshing data...', 'info');
    await this.loadData();
  }

  connectWebSocket() {
    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(`${protocol}//${location.host}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => this.connectWebSocket(), this.reconnectInterval);
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'status_update':
        this.updateSystemStatus(data.data);
        break;
      case 'activity':
        this.addActivity(data.message);
        break;
      case 'funding_opportunities':
        this.data.funding = data.data;
        this.updateFundingDisplay();
        break;
    }
  }

  addActivity(message) {
    this.data.activities.unshift({
      icon: '📡',
      title: message,
      time: 'Just now'
    });
    
    // Keep only recent activities
    if (this.data.activities.length > 10) {
      this.data.activities = this.data.activities.slice(0, 10);
    }
    
    this.updateActivityFeed();
  }

  // Action handlers
  async scanFunding() {
    const scanBtn = document.querySelector('.action-btn.primary');
    if (scanBtn) {
      scanBtn.innerHTML = '<span class="btn-icon">⏳</span>Scanning...';
      scanBtn.disabled = true;
    }
    
    try {
      const response = await fetch('/api/scan-funding', { method: 'POST' });
      if (response.ok) {
        const opportunities = await response.json();
        this.data.funding = opportunities;
        this.updateFundingDisplay();
        this.showToast('✅', `Found ${opportunities.length} opportunities`, 'success');
      } else {
        throw new Error('Scan failed');
      }
    } catch (error) {
      this.showToast('❌', 'Funding scan failed', 'error');
    } finally {
      if (scanBtn) {
        scanBtn.innerHTML = '<span class="btn-icon">🔍</span>Scan New Opportunities';
        scanBtn.disabled = false;
      }
    }
  }

  async exportOpportunities() {
    window.open('/api/export/opportunities.csv', '_blank');
    this.showToast('📊', 'Exporting opportunities...', 'info');
  }

  openNotion() {
    // Open the main EUFM hub (parent page)
    const url = this.notionParentUrl || 'https://www.notion.so';
    window.open(url, '_blank');
  }

  openNotionControl() {
    // Open the live business feed page if it exists, otherwise main hub
    const url = this.notionParentUrl || 'https://www.notion.so';
    window.open(url, '_blank');
  }

  openCriticalDeadlines() {
    const url = (this.notionLinks && this.notionLinks.criticalDeadlinesUrl) || this.notionParentUrl || 'https://www.notion.so';
    window.open(url, '_blank');
  }

  async syncNotion() {
    this.showToast('🔄', 'Syncing with Notion...', 'info');
    try {
      const response = await fetch('/api/notion/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'all' }) });
      if (!response.ok) throw new Error('Sync failed');
      this.showToast('✅', 'Notion sync completed', 'success');
      this.addActivity('Manual Notion sync completed');
    } catch (error) {
      this.showToast('❌', 'Notion sync failed', 'error');
    }
  }

  async dailyUpdate() {
    this.showToast('📅', 'Running daily update...', 'info');
    try {
      const response = await fetch('/api/notion/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'daily' }) });
      if (!response.ok) throw new Error('Daily update failed');
      this.showToast('✅', 'Daily briefing posted to Notion', 'success');
      this.addActivity('Daily briefing generated and synced to Notion');
    } catch (error) {
      this.showToast('❌', 'Daily update failed', 'error');
    }
  }

  // Assistant overlay functions
  openAssistant() {
    const ov = document.getElementById('assistant-overlay');
    if (!ov) return;
    ov.classList.add('show');
    const closeBtn = document.getElementById('assistant-close');
    const sendBtn = document.getElementById('assistant-send');
    const input = document.getElementById('assistant-input');
    const send = async () => {
      const msg = input.value.trim();
      if (!msg) return;
      this.appendAssistant('You', msg);
      input.value = '';
      try {
        const resp = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
        const data = await resp.json();
        this.appendAssistant('Assistant', data?.reply || 'No response');
      } catch { this.appendAssistant('Assistant', 'Assistant unavailable'); }
    };
    if (closeBtn) closeBtn.onclick = () => ov.classList.remove('show');
    if (sendBtn) sendBtn.onclick = () => send();
    if (input) input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
    input?.focus();
  }

  appendAssistant(who, text) {
    const list = document.getElementById('assistant-messages');
    if (!list) return;
    const div = document.createElement('div');
    div.className = 'assistant-msg';
    div.innerHTML = `<div class="who">${who}</div><div class="text">${text}</div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  handleQuickAction(label) {
    switch (label) {
      case 'Live Business Feed':
        this.openNotion();
        break;
      case 'Master Control Center':
        this.openNotionControl();
        break;
      case 'Sync Notion Now':
        this.syncNotion();
        break;
      case 'Daily Update':
        this.dailyUpdate();
        break;
    }
  }

  viewDeadlines() {
    this.openCriticalDeadlines();
  }

  showToast(icon, message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast?.querySelector('.toast-icon');
    const toastMessage = toast?.querySelector('.toast-message');
    
    if (toast && toastIcon && toastMessage) {
      toast.className = `toast ${type}`;
      toastIcon.textContent = icon;
      toastMessage.textContent = message;
      
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }
}

// Global functions for onclick handlers
function openNotion() {
  window.dashboard.openNotion();
}

function openNotionControl() {
  window.dashboard.openNotionControl();
}

function refreshData() {
  window.dashboard.refreshData();
}

function scanFunding() {
  window.dashboard.scanFunding();
}

function exportOpportunities() {
  window.dashboard.exportOpportunities();
}

function syncNotion() {
  window.dashboard.syncNotion();
}

function dailyUpdate() {
  window.dashboard.dailyUpdate();
}

function viewDeadlines() {
  window.dashboard.viewDeadlines();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new EUFMDashboard();
});
