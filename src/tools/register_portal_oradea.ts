import 'dotenv/config';
import { projectRegistry, type ProjectMetadata } from '../masterControl/projectRegistry.js';
import { repoPath } from '../utils/paths.js';

async function main() {
  try {
    const project: ProjectMetadata = {
      id: 'portal_oradea',
      name: 'Portal Oradea',
      description: 'Regional business & investment attraction platform for Oradea/Bihor',
      status: 'planned',
      priority: 'P2',
      budget: {
        allocated: 5_000_000, // lower bound of stated range (EUR)
        spent: 0,
        currency: 'EUR',
        target: 15_000_000 // upper bound target (EUR)
      },
      timeline: {
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        milestones: [
          { name: 'Q1 2025: Foundation', date: '2025-03-31', status: 'pending' },
          { name: 'Q2 2025: Development', date: '2025-06-30', status: 'pending' },
          { name: 'Q3 2025: Pilot', date: '2025-09-30', status: 'pending' },
          { name: 'Q4 2025: Rollout', date: '2025-12-31', status: 'pending' }
        ]
      },
      resources: {
        agents: [],
        computeAllocation: 0,
        apiCredits: 0,
        teamMembers: []
      },
      metrics: {
        healthScore: 0,
        progressPercentage: 0,
        riskLevel: 'medium',
        lastUpdated: new Date().toISOString()
      },
      dependencies: {
        dependsOn: [],
        blockedBy: [],
        synergiesWith: []
      },
      automatedTasks: [],
      location: {
        baseDirectory: repoPath('PROJECTS', 'Portal Oradea'),
        configFile: 'PROJECT_BRIEF.md',
        logsDirectory: repoPath('logs', 'Portal Oradea')
      }
    };

    await projectRegistry.registerProject(project);
    console.log('✅ Portal Oradea project registered in project registry.');
  } catch (err: any) {
    console.error('❌ Failed to register Portal Oradea:', err?.message || err);
    process.exit(1);
  }
}

main();
