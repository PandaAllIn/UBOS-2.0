import { promises as fs } from 'fs';
import path from 'path';

export interface SessionUpdate {
  timestamp: string;
  sessionSummary: string;
  majorAchievements: string[];
  currentPriorities: string[];
  systemStatus: string;
  nextSessionFocus: string;
  criticalDeadlines: Array<{ description: string; date: string; daysRemaining: number }>;
  newCapabilities?: string[];
  newFiles?: string[];
  performanceMetrics?: Record<string, string>;
}

export class SessionMemoryUpdater {
  private memoryFilePath: string;

  constructor() {
    this.memoryFilePath = path.resolve('CLAUDE_SESSION_MEMORY.md');
  }

  /**
   * Update the session memory file with current context
   */
  async updateSessionMemory(update: SessionUpdate): Promise<void> {
    try {
      const existingContent = await fs.readFile(this.memoryFilePath, 'utf-8');
      const updatedContent = await this.generateUpdatedContent(existingContent, update);
      await fs.writeFile(this.memoryFilePath, updatedContent, 'utf-8');
      
      console.log(`📝 Session memory updated: ${this.memoryFilePath}`);
      
      // Also create a timestamped backup
      const backupPath = path.join('logs', 'session_memory', `session_memory_${Date.now()}.md`);
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(backupPath, updatedContent, 'utf-8');
      
    } catch (error: unknown) {
      console.error('❌ Failed to update session memory:', error);
      throw error;
    }
  }

  /**
   * Generate updated content by modifying key sections
   */
  private async generateUpdatedContent(existingContent: string, update: SessionUpdate): Promise<string> {
    let content = existingContent;

    // Update timestamp
    content = content.replace(
      /\*\*Last Updated\*\*: [^\n]+/, 
      `**Last Updated**: ${update.timestamp}`
    );

    // Update session summary section
    const sessionSummarySection = this.buildSessionSummary(update);
    content = content.replace(
      /(### \*\*What Just Happened \(Current Session Summary\)\*\*\n```yaml\n)([^`]+)(```)/,
      `$1${sessionSummarySection}$3`
    );

    // Update system status
    content = content.replace(
      /\*\*Project Status\*\*: [^\n]+/, 
      `**Project Status**: ${update.systemStatus}`
    );

    // Update next session priority
    content = content.replace(
      /\*\*Next Session Priority\*\*: [^\n]+/, 
      `**Next Session Priority**: ${update.nextSessionFocus}`
    );

    // Update active priorities section if current priorities provided
    if (update.currentPriorities.length > 0) {
      const prioritiesSection = this.buildPrioritiesSection(update.currentPriorities, update.criticalDeadlines);
      content = content.replace(
        /(### \*\*🎯 ACTIVE PRIORITIES\*\*\n\n)(.*?)(?=\n---)/s,
        `$1${prioritiesSection}`
      );
    }

    // Add new capabilities if provided
    if (update.newCapabilities && update.newCapabilities.length > 0) {
      const newCapabilitiesSection = this.buildNewCapabilitiesSection(update.newCapabilities);
      // Insert before the "ACTIVE PRIORITIES" section
      content = content.replace(
        /(### \*\*🎯 ACTIVE PRIORITIES\*\*)/,
        `${newCapabilitiesSection}\n\n$1`
      );
    }

    return content;
  }

  /**
   * Build session summary section
   */
  private buildSessionSummary(update: SessionUpdate): string {
    const achievements = update.majorAchievements.map(a => `  ✅ ${a}`).join('\n');
    
    return `Major Progress This Session:
${achievements}

Session Summary: ${update.sessionSummary}

System Status: ${update.systemStatus}
Next Focus: ${update.nextSessionFocus}
`;
  }

  /**
   * Build priorities section with deadlines
   */
  private buildPrioritiesSection(priorities: string[], deadlines: SessionUpdate['criticalDeadlines']): string {
    let section = '';
    
    // Add critical deadlines
    if (deadlines.length > 0) {
      section += '#### **CRITICAL DEADLINES** ⚡\n```yaml\n';
      deadlines.forEach(deadline => {
        const urgency = deadline.daysRemaining <= 7 ? '🔴 URGENT' : 
                       deadline.daysRemaining <= 14 ? '🟡 IMPORTANT' : '🟢 PLANNED';
        section += `${deadline.description}: ${deadline.date} (${deadline.daysRemaining} days) ${urgency}\n`;
      });
      section += '```\n\n';
    }

    // Add current priorities
    section += '#### **CURRENT PRIORITIES** 🎯\n```yaml\n';
    priorities.forEach((priority, index) => {
      section += `Priority ${index + 1}: ${priority}\n`;
    });
    section += '```\n';

    return section;
  }

  /**
   * Build new capabilities section
   */
  private buildNewCapabilitiesSection(capabilities: string[]): string {
    let section = '### **🆕 NEW CAPABILITIES ADDED THIS SESSION**\n\n';
    capabilities.forEach(capability => {
      section += `- **✅ ${capability}**\n`;
    });
    return section;
  }

  /**
   * Quick update method for end of session
   */
  async quickSessionUpdate(summary: string, achievements: string[], nextFocus: string): Promise<void> {
    const update: SessionUpdate = {
      timestamp: new Date().toISOString().replace('T', ', ').split('.')[0] + ' UTC',
      sessionSummary: summary,
      majorAchievements: achievements,
      currentPriorities: [],
      systemStatus: '🎯 OPERATIONAL',
      nextSessionFocus: nextFocus,
      criticalDeadlines: [
        {
          description: 'Horizon Europe Application Deadline',
          date: 'September 18, 2025',
          daysRemaining: this.calculateDaysRemaining('2025-09-18')
        }
      ]
    };

    await this.updateSessionMemory(update);
  }

  /**
   * Calculate days remaining until a date
   */
  private calculateDaysRemaining(dateString: string): number {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Add performance metrics to session memory
   */
  async addPerformanceMetrics(metrics: Record<string, string>): Promise<void> {
    try {
      const content = await fs.readFile(this.memoryFilePath, 'utf-8');
      
      let metricsSection = '\n### **📊 LATEST PERFORMANCE METRICS**\n```yaml\n';
      Object.entries(metrics).forEach(([key, value]) => {
        metricsSection += `${key}: ${value}\n`;
      });
      metricsSection += '```\n';

      // Insert before the final session context section
      const updatedContent = content.replace(
        /(## 🎯 FINAL SESSION CONTEXT)/,
        `${metricsSection}\n$1`
      );

      await fs.writeFile(this.memoryFilePath, updatedContent, 'utf-8');
      console.log('📊 Performance metrics added to session memory');
      
    } catch (error: unknown) {
      console.error('❌ Failed to add performance metrics:', error);
    }
  }
}

// Usage examples and CLI integration
export async function updateSessionAtEnd(summary: string, achievements: string[], nextFocus: string): Promise<void> {
  const updater = new SessionMemoryUpdater();
  await updater.quickSessionUpdate(summary, achievements, nextFocus);
}

export async function addMetricsToSession(metrics: Record<string, string>): Promise<void> {
  const updater = new SessionMemoryUpdater();
  await updater.addPerformanceMetrics(metrics);
}

// Auto-update hook for CLI commands
export async function trackCommandExecution(command: string, duration: number, success: boolean): Promise<void> {
  const metricsFile = path.join('logs', 'session_metrics.json');
  
  try {
    let metrics: { commands: { command: string; duration: number; success: boolean; timestamp: string; }[] } = { commands: [] };
    try {
      const existingMetrics = await fs.readFile(metricsFile, 'utf-8');
      metrics = JSON.parse(existingMetrics);
    } catch {
      // File doesn't exist yet
    }

    if (!metrics.commands) metrics.commands = [];
    
    metrics.commands.push({
      command,
      duration,
      success,
      timestamp: new Date().toISOString()
    });

    // Keep only last 100 commands
    if (metrics.commands.length > 100) {
      metrics.commands = metrics.commands.slice(-100);
    }

    await fs.mkdir(path.dirname(metricsFile), { recursive: true });
    await fs.writeFile(metricsFile, JSON.stringify(metrics, null, 2), 'utf-8');
    
  } catch (error: unknown) {
    // Fail silently - this is background tracking
    console.warn('⚠️ Could not track command metrics:', error);
  }
}
