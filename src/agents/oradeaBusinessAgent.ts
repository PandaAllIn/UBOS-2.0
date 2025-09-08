import 'dotenv/config';
import { BaseAgent } from './baseAgent.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { EnhancedAbacusAgent } from './enhancedAbacusAgent.js';

interface ContactInfo {
  name: string;
  position: string;
  organization: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  address?: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
  lastContact?: string;
  nextAction?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: ContactInfo[];
  agenda: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  followUp?: string[];
}

interface InstitutionalPartnership {
  organization: string;
  type: 'government' | 'educational' | 'chamber' | 'business' | 'coworking';
  keyContacts: ContactInfo[];
  partnershipLevel: 'potential' | 'initial' | 'active' | 'strategic';
  benefits: string[];
  requirements: string[];
  status: string;
}

export class OradeaBusinessAgent extends BaseAgent {
  private contacts: ContactInfo[] = [];
  private meetings: Meeting[] = [];
  private partnerships: InstitutionalPartnership[] = [];
  private researchAgent: EnhancedAbacusAgent;

  constructor() {
    super('Oradea Business Development Agent');
    this.researchAgent = new EnhancedAbacusAgent();
    
    // Initialize with known key institutions
    this.initializeKeyInstitutions();
  }

  private initializeKeyInstitutions() {
    // Key Oradea institutions based on research
    const keyInstitutions: InstitutionalPartnership[] = [
      {
        organization: "Oradea City Hall",
        type: "government",
        keyContacts: [{
          name: "Mayor Office",
          position: "Mayor",
          organization: "Oradea City Hall",
          email: "primaria@oradea.ro",
          phone: "+40 259 437 000",
          address: "Piața Unirii nr. 1, 410100 Oradea",
          priority: "high",
          notes: "Main government contact for business development"
        }],
        partnershipLevel: "potential",
        benefits: ["Business permits", "Local legislation", "Investment support"],
        requirements: ["Formal proposal", "Business plan", "Local presence"],
        status: "Not contacted"
      },
      {
        organization: "University of Oradea",
        type: "educational",
        keyContacts: [{
          name: "Business Development Office",
          position: "Partnership Coordinator",
          organization: "University of Oradea",
          address: "Str. Universității 1, Oradea 410087",
          priority: "high",
          notes: "Key for research partnerships and student talent"
        }],
        partnershipLevel: "potential",
        benefits: ["Research collaboration", "Student talent", "EU project partnerships"],
        requirements: ["Academic collaboration proposal", "Research focus alignment"],
        status: "Not contacted"
      },
      {
        organization: "Chamber of Commerce Bihor",
        type: "chamber",
        keyContacts: [{
          name: "Business Development",
          position: "Director",
          organization: "Chamber of Commerce Bihor",
          priority: "high",
          notes: "Key for local business network and regulatory guidance"
        }],
        partnershipLevel: "potential",
        benefits: ["Business network", "Regulatory guidance", "Export support"],
        requirements: ["Chamber membership", "Business registration"],
        status: "Not contacted"
      },
      {
        organization: "Oradea Tech Hub",
        type: "coworking",
        keyContacts: [{
          name: "Community Manager",
          position: "Community Manager",
          organization: "Oradea Tech Hub",
          address: "Oradea Fortress, Building I, 1st floor",
          priority: "medium",
          notes: "Historic fortress location, tech startup focus"
        }],
        partnershipLevel: "potential",
        benefits: ["Office space", "Tech community", "Networking events"],
        requirements: ["Membership application", "Space rental agreement"],
        status: "Not contacted"
      }
    ];

    this.partnerships = keyInstitutions;
  }

  async researchOradeaContacts(query: string): Promise<ContactInfo[]> {
    const actionId = await agentActionLogger.startWork(
      'OradeaBusinessAgent',
      `Research Oradea contacts: ${query}`,
      'Using Enhanced Abacus for local research',
      'research'
    );

    try {
      console.log(`🔍 Researching Oradea contacts: ${query}`);
      
      const research = await this.researchAgent.research(
        `${query} Oradea Romania contacts email phone address 2025`
      );
      
      // Parse research results into contacts
      const contacts: ContactInfo[] = this.parseContactsFromResearch(research.summary, query);
      
      this.contacts.push(...contacts);
      
      await agentActionLogger.completeWork(
        actionId,
        `Found ${contacts.length} potential contacts for ${query}`,
        []
      );

      console.log(`✅ Research completed: ${contacts.length} contacts found`);
      return contacts;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Research failed: ${error}`,
        []
      );
      throw error;
    }
  }

  private parseContactsFromResearch(research: string, context: string): ContactInfo[] {
    // Basic parsing of research results into contact format
    const contacts: ContactInfo[] = [];
    
    // Look for email patterns, phone patterns, names, etc.
    const emailMatches = research.match(/[\w.-]+@[\w.-]+\.\w+/g);
    const phoneMatches = research.match(/\+?[\d\s\-\(\)]{10,}/g);
    
    if (emailMatches || phoneMatches) {
      contacts.push({
        name: `Contact from ${context}`,
        position: "TBD",
        organization: context,
        email: emailMatches?.[0],
        phone: phoneMatches?.[0],
        priority: "medium",
        notes: `Found through research: ${context}`
      });
    }
    
    return contacts;
  }

  async scheduleInstitutionalMeeting(
    organizationName: string, 
    purpose: string, 
    preferredDates: string[]
  ): Promise<Meeting> {
    const actionId = await agentActionLogger.startWork(
      'OradeaBusinessAgent',
      `Schedule meeting with ${organizationName}`,
      `Purpose: ${purpose}`,
      'coordination'
    );

    try {
      console.log(`📅 Scheduling meeting with ${organizationName}`);
      
      const partnership = this.partnerships.find(p => p.organization === organizationName);
      if (!partnership) {
        throw new Error(`Organization ${organizationName} not found in partnerships`);
      }

      const meeting: Meeting = {
        id: `meeting_${Date.now()}`,
        title: `${organizationName} - ${purpose}`,
        date: preferredDates[0], // Use first preferred date
        time: "10:00", // Default time
        location: partnership.keyContacts[0]?.address || "TBD",
        attendees: partnership.keyContacts,
        agenda: [
          "Introduction and project overview",
          "Partnership opportunities discussion",
          "Next steps and follow-up actions"
        ],
        status: "scheduled",
        notes: `Meeting scheduled for Portal Oradea project development`
      };

      this.meetings.push(meeting);
      
      await agentActionLogger.completeWork(
        actionId,
        `Meeting scheduled with ${organizationName} for ${preferredDates[0]}`,
        []
      );

      console.log(`✅ Meeting scheduled: ${meeting.title}`);
      return meeting;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Meeting scheduling failed: ${error}`,
        []
      );
      throw error;
    }
  }

  async generateWeeklyActionPlan(): Promise<string> {
    const actionId = await agentActionLogger.startWork(
      'OradeaBusinessAgent',
      'Generate weekly action plan',
      'Creating prioritized action plan for Oradea business development',
      'coordination'
    );

    try {
      const plan = `
# 📅 ORADEA BUSINESS DEVELOPMENT - WEEKLY ACTION PLAN

## 🎯 This Week's Priorities

### Day 1-2: Government & Legal Research
- **Contact Oradea City Hall Business Development Office**
  - Schedule meeting with Mayor's office
  - Request local legislation documentation
  - Discuss Portal Oradea project vision

### Day 3-4: Institutional Partnerships  
- **University of Oradea Outreach**
  - Contact partnership coordinator
  - Propose research collaboration
  - Explore student talent pipeline

### Day 5: Business Community Integration
- **Chamber of Commerce Bihor**
  - Membership inquiry and meeting
  - Local business network introduction
  - Regulatory compliance guidance

## 📍 Office Space Priority Targets

1. **Oradea Tech Hub** (Fortress location)
   - Historic setting, tech focus
   - Community networking events
   - Strategic visibility

2. **Work+ Offices** (Civic Center)
   - Modern facilities, fortress views
   - Central location
   - Professional environment

## 📞 Key Contacts to Establish This Week

${this.partnerships.map(p => 
  `- **${p.organization}**: ${p.keyContacts[0]?.name} (${p.keyContacts[0]?.priority} priority)`
).join('\n')}

## 📊 Success Metrics
- Meetings scheduled: Target 3+
- Partnerships initiated: Target 2+
- Office space identified: Target 1
- Local network contacts: Target 10+

## 🔄 Next Week Preparation
- EU funding legislation research
- Partnership agreements drafting  
- Portal Oradea presentation materials
- Local market analysis completion
      `;

      await agentActionLogger.completeWork(
        actionId,
        'Weekly action plan generated with priorities and contacts',
        []
      );

      console.log(`✅ Weekly action plan generated`);
      return plan;
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Action plan generation failed: ${error}`,
        []
      );
      throw error;
    }
  }

  async getPartnershipStatus(): Promise<InstitutionalPartnership[]> {
    return this.partnerships;
  }

  async getUpcomingMeetings(): Promise<Meeting[]> {
    return this.meetings.filter(m => m.status === 'scheduled');
  }

  async getContactDirectory(): Promise<ContactInfo[]> {
    return this.contacts;
  }

  async updateContactNotes(contactName: string, notes: string): Promise<void> {
    const contact = this.contacts.find(c => c.name === contactName);
    if (contact) {
      contact.notes = notes;
      contact.lastContact = new Date().toISOString().split('T')[0];
    }
  }
}