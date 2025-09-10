import 'dotenv/config';
import { projectRegistry, type ProjectMetadata } from '../masterControl/projectRegistry.js';
import { repoPath } from '../utils/paths.js';

async function main() {
  try {
    const project: ProjectMetadata = {
      id: 'geo_data_center',
      name: 'GeoDataCenter',
      description: 'Geothermal-powered AI Data Center initiative with EU funding focus',
      status: 'active',
      priority: 'P1',
      budget: {
        allocated: 10_000_000, // lower bound of stated range (EUR)
        spent: 0,
        currency: 'EUR',
        target: 50_000_000 // upper bound target (EUR)
      },
      timeline: {
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '2025-09-30', // Deadline: September 2025
        milestones: [
          {
            name: 'Project Registration in Registry',
            date: new Date().toISOString().slice(0, 10),
            status: 'completed'
          },
          {
            name: 'EU Funding Application Window',
            date: '2025-09-01',
            status: 'in_progress'
          },
          {
            name: 'Funding Decision Expected',
            date: '2025-09-30',
            status: 'pending'
          }
        ]
      },
      resources: {
        agents: ['AgentSummoner', 'EUFundingProposal', 'EnhancedAbacus', 'CodexCLI', 'ProjectMonitor'],
        computeAllocation: 30,
        apiCredits: 10000,
        teamMembers: ['Core Team']
      },
      metrics: {
        healthScore: 80,
        progressPercentage: 5,
        riskLevel: 'medium',
        lastUpdated: new Date().toISOString()
      },
      dependencies: {
        dependsOn: [],
        blockedBy: [],
        synergiesWith: ['eufm_funding']
      },
      automatedTasks: [
        {
          id: 'geo_funding_deadline_monitor',
          description: 'Monitor September 2025 deadline and reminders',
          schedule: '0 9 * * *',
          agent: 'ProjectMonitor',
          nextRun: new Date().toISOString(), // will be recomputed by registry for next run pattern if added via addAutomatedTask
          status: 'active'
        }
      ],
      location: {
        baseDirectory: repoPath('PROJECTS', 'GeoDataCenter'),
        configFile: 'Claude Geo.md',
        logsDirectory: repoPath('logs', 'GeoDataCenter')
      }
    };

    await projectRegistry.registerProject(project);
    console.log('✅ GeoDataCenter project registered in project registry.');
  } catch (err: any) {
    console.error('❌ Failed to register GeoDataCenter:', err?.message || err);
    process.exit(1);
  }
}

main();
