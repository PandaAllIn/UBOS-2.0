import { OptimizationEngine } from '../analytics/optimizationEngine.js';
import { ToolUsageTracker } from '../analytics/toolUsageTracker.js';
import { SubscriptionManager, FileSubscriptionStore } from '../analytics/subscriptionManager.js';
import { LearnedPattern, PatternLearner } from './patternLearner.js';

export interface AdvisoryReport {
  systemSuggestions: string[];
  learnedPatterns: LearnedPattern[];
}

export class ProactiveAdvisor {
  subs = new SubscriptionManager(new FileSubscriptionStore('logs/analytics/subscriptions.json'));
  tracker = new ToolUsageTracker();
  engine = new OptimizationEngine(this.subs, this.tracker);
  learner = new PatternLearner();

  async advise(): Promise<AdvisoryReport> {
    const events = await this.tracker.list();
    const report = await this.engine.buildReport(events);
    const learned = await this.learner.list();
    const sys: string[] = [];

    // Convert optimization suggestions to simple text advice
    for (const s of report.suggestions) sys.push(`[${s.impact}] ${s.title}: ${s.details}${s.action ? ` | Action: ${s.action}` : ''}`);

    // Meta-suggestions based on learned patterns
    for (const p of learned) {
      if (p.signals.includes('needs-retry-with-backoff')) sys.push('Enable exponential backoff and jitter for API retries to reduce failures.');
      if (p.signals.includes('tests-helped')) sys.push('Automatically scaffold minimal tests for coding tasks to reduce regressions.');
      if (p.signals.includes('browser-automation-applicable')) sys.push('Bundle browser steps and cache sessions to reduce logins.');
    }

    // De-duplicate
    const deduped = Array.from(new Set(sys));
    return { systemSuggestions: deduped, learnedPatterns: learned };
  }
}

