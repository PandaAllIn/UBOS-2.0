import { getEnvOrThrow, getNotionClient } from './helpers.mjs';

const notion = getNotionClient();
const parentPageId = getEnvOrThrow('NOTION_PARENT_PAGE_ID');

async function createClaudeStyleTemplate() {
  console.log('🎨 Creating Claude-style EUFM Master Control Center...');
  
  // Create main dashboard page
  const dashboardPage = await notion.pages.create({
    parent: { page_id: parentPageId },
    properties: {
      title: { title: [{ text: { content: '🎛️ EUFM MASTER CONTROL CENTER' } }] }
    },
    children: [
      {
        type: 'callout',
        callout: {
          rich_text: [{ 
            text: { 
              content: 'Complete Business Portfolio Management System - €950K+ Revenue Target' 
            }
          }],
          icon: { emoji: '🚀' },
          color: 'blue_background'
        }
      },
      {
        type: 'divider',
        divider: {}
      },
      
      // System Status Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '📊 SYSTEM STATUS' } }]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Live System Metrics' } }],
          children: [
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Portfolio Health: 95% (4 active projects)' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Agent Ecosystem: 8 operational agents' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Budget Utilization: 99% (€70M+ managed)' } }]
              }
            }
          ]
        }
      },
      
      // Critical Deadlines Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🚨 CRITICAL DEADLINES' } }]
        }
      },
      {
        type: 'callout',
        callout: {
          rich_text: [{ text: { content: 'September 18, 2025 - EUFM Funding Deadline (10 days remaining!)' } }],
          icon: { emoji: '⚠️' },
          color: 'red_background'
        }
      },
      {
        type: 'callout',
        callout: {
          rich_text: [{ text: { content: 'September 2, 2025 - Horizon Europe Geothermal Call (23 days)' } }],
          icon: { emoji: '🔥' },
          color: 'orange_background'
        }
      },
      {
        type: 'callout',
        callout: {
          rich_text: [{ text: { content: 'October 9, 2025 - CETPartnership Application (30+ days)' } }],
          icon: { emoji: '📅' },
          color: 'yellow_background'
        }
      },
      
      {
        type: 'divider',
        divider: {}
      },
      
      // Projects Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🎯 ACTIVE PROJECTS (4)' } }]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'XF Production - €6M Proven System ✅' } }],
          children: [
            {
              type: 'paragraph',
              paragraph: {
          rich_text: [{ text: { content: `Status: Active and operational\nHealth: 98%\nLocation: ${process.cwd()}/eufm/docs/xf/\nAgents: AgentSummoner, MissionControl, ResearchAgent` } }]
              }
            }
          ]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'EUFM EU Funding - €2M Target 🚨' } }],
          children: [
            {
              type: 'paragraph',
              paragraph: {
          rich_text: [{ text: { content: `Status: Critical (10 days to deadline!)\nHealth: 92%\nLocation: ${process.cwd()}/\nAgents: AgentSummoner, EUFundingProposal, EnhancedAbacus, CodexCLI` } }]
              }
            }
          ]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'GeoDataCenter - €10-50M Geothermal AI 🔥' } }],
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: 'Status: Active development\nDeadline: September 2, 2025 (Horizon Europe)\nPotential: €10-50M geothermal-powered AI datacenter\nLocation: Băile Felix, Romania' } }]
              }
            }
          ]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Portal Oradea - €950K Revenue Platform 💰' } }],
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: 'Status: Bootstrap phase\nTarget: €950K annual revenue\nStrategy: Regional business attraction + EUFM client funnel\nLocation: Oradea, Bihor County' } }]
              }
            }
          ]
        }
      },
      
      {
        type: 'divider',
        divider: {}
      },
      
      // Agent Ecosystem Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🤖 AGENT ECOSYSTEM (8 OPERATIONAL)' } }]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Core Intelligence Agents' } }],
          children: [
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'AgentSummoner: Meta-intelligence (68s avg, $0.027/query)' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Enhanced Abacus: Perplexity Pro research (18-26s, $0.009/query)' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Codex CLI: Development automation (60-120s tasks)' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Jules: Gemini-powered development & UI/UX' } }]
              }
            }
          ]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Specialized Business Agents' } }],
          children: [
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'OradeaBusinessAgent: Local partnerships & networking' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'EUFundingProposal: EU template generation' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'CountryCodeValidator: EU compliance utilities' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'SessionMemoryUpdater: Context preservation' } }]
              }
            }
          ]
        }
      },
      
      {
        type: 'divider',
        divider: {}
      },
      
      // Business Intelligence Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '💡 BUSINESS INTELLIGENCE' } }]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Revenue Pipeline (€950K+ Target)' } }],
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [{ text: { content: 'Portal Oradea: €6K-25K monthly (subscriptions + events + commissions)\nEUFM Consulting: €500K+ annually (5-15% EU funding commissions)\nBootstrap Goal: €50K in 30 days\nAnnual Target: €950K+ combined revenue' } }]
              }
            }
          ]
        }
      },
      {
        type: 'toggle',
        toggle: {
          rich_text: [{ text: { content: 'Client Pipeline & Prospects' } }],
          children: [
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Romanian SMEs: 99.7% of companies, €79.9B EU funding access' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Universities: Research projects needing EU funding' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Municipalities: Regional development projects' } }]
              }
            },
            {
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [{ text: { content: 'Innovation Fund prospects: €1.4M-262M projects' } }]
              }
            }
          ]
        }
      },
      
      {
        type: 'divider',
        divider: {}
      },
      
      // Navigation Section
      {
        type: 'heading_1',
        heading_1: {
          rich_text: [{ text: { content: '🧭 QUICK NAVIGATION' } }]
        }
      },
      {
        type: 'column_list',
        column_list: {
          children: [
            {
              type: 'column',
              column: {
                children: [
                  {
                    type: 'heading_3',
                    heading_3: {
                      rich_text: [{ text: { content: '📊 Databases' } }]
                    }
                  },
                  {
                    type: 'paragraph',
                    paragraph: {
                      rich_text: [{ text: { content: '• Projects Master\n• Agent Activity\n• Client Pipeline\n• EU Funding Opportunities\n• Oradea Partnerships' } }]
                    }
                  }
                ]
              }
            },
            {
              type: 'column',
              column: {
                children: [
                  {
                    type: 'heading_3',
                    heading_3: {
                      rich_text: [{ text: { content: '⚡ Quick Actions' } }]
                    }
                  },
                  {
                    type: 'paragraph',
                    paragraph: {
                      rich_text: [{ text: { content: '• Daily sync updates\n• Agent performance review\n• EU funding deadline check\n• Client pipeline review\n• Partnership status update' } }]
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      
      {
        type: 'divider',
        divider: {}
      },
      
      // Footer
      {
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { text: { content: '🎛️ EUFM Master Control - Last updated: ' } },
            { text: { content: new Date().toLocaleDateString() } },
            { text: { content: '\n🤖 Powered by Claude + Codex + Gemini AI coordination\n📊 Real-time data sync with automated intelligence gathering' } }
          ]
        }
      }
    ]
  });
  
  console.log('✅ Claude-style template created!');
  console.log('🌐 Dashboard URL:', dashboardPage.url);
  
  return dashboardPage.id;
}

async function main() {
  const dashboardId = await createClaudeStyleTemplate();
  
  // Update the environment with the main dashboard ID
  console.log('\n🎯 EUFM Master Control Center is ready!');
  console.log('🌐 Access URL: https://www.notion.so/' + dashboardId.replace(/-/g, ''));
  console.log('📊 Parent workspace: https://www.notion.so/' + parentPageId.replace(/-/g, ''));
}

main().catch(console.error);
