#!/usr/bin/env node
import 'dotenv/config';
import { OradeaBusinessAgent } from '../agents/oradeaBusinessAgent.js';

async function main() {
  const agent = new OradeaBusinessAgent();
  const cmd = process.argv[2] || 'help';
  const args = process.argv.slice(3);

  console.log(`🏛️ Oradea Business Development Agent`);
  console.log(`📍 Command: ${cmd}\n`);

  switch (cmd) {
    case 'plan:weekly': {
      console.log('📅 Generating weekly action plan...');
      const plan = await agent.generateWeeklyActionPlan();
      console.log(plan);
      break;
    }

    case 'research:contacts': {
      const query = args.join(' ') || 'Oradea business development';
      console.log(`🔍 Researching contacts: ${query}`);
      const contacts = await agent.researchOradeaContacts(query);
      console.log(`\n📞 Found ${contacts.length} potential contacts:`);
      contacts.forEach(contact => {
        console.log(`- ${contact.name} (${contact.position}) at ${contact.organization}`);
        if (contact.email) console.log(`  📧 ${contact.email}`);
        if (contact.phone) console.log(`  📱 ${contact.phone}`);
        console.log(`  Priority: ${contact.priority}\n`);
      });
      break;
    }

    case 'meeting:schedule': {
      const organization = args[0];
      const purpose = args.slice(1).join(' ') || 'Partnership discussion';
      
      if (!organization) {
        console.log('❌ Please specify organization name');
        console.log('Usage: meeting:schedule "Organization Name" purpose');
        break;
      }

      console.log(`📅 Scheduling meeting with ${organization}...`);
      const preferredDates = [
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Next week
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Week after
      ];
      
      try {
        const meeting = await agent.scheduleInstitutionalMeeting(organization, purpose, preferredDates);
        console.log(`✅ Meeting scheduled:`);
        console.log(`   Title: ${meeting.title}`);
        console.log(`   Date: ${meeting.date}`);
        console.log(`   Location: ${meeting.location}`);
        console.log(`   Attendees: ${meeting.attendees.map(a => a.name).join(', ')}`);
      } catch (error: any) {
        console.log(`❌ Failed to schedule meeting: ${error}`);
      }
      break;
    }

    case 'partnerships:status': {
      console.log('🤝 Partnership Status Overview:');
      const partnerships = await agent.getPartnershipStatus();
      partnerships.forEach(partnership => {
        console.log(`\n📋 ${partnership.organization}`);
        console.log(`   Type: ${partnership.type}`);
        console.log(`   Level: ${partnership.partnershipLevel}`);
        console.log(`   Status: ${partnership.status}`);
        console.log(`   Key Benefits: ${partnership.benefits.join(', ')}`);
        console.log(`   Requirements: ${partnership.requirements.join(', ')}`);
        if (partnership.keyContacts.length > 0) {
          console.log(`   Key Contact: ${partnership.keyContacts[0].name} (${partnership.keyContacts[0].priority} priority)`);
        }
      });
      break;
    }

    case 'meetings:upcoming': {
      console.log('📅 Upcoming Meetings:');
      const meetings = await agent.getUpcomingMeetings();
      if (meetings.length === 0) {
        console.log('   No meetings scheduled');
      } else {
        meetings.forEach(meeting => {
          console.log(`\n🗓️  ${meeting.title}`);
          console.log(`   Date: ${meeting.date} at ${meeting.time}`);
          console.log(`   Location: ${meeting.location}`);
          console.log(`   Attendees: ${meeting.attendees.map(a => a.name).join(', ')}`);
          console.log(`   Status: ${meeting.status}`);
        });
      }
      break;
    }

    case 'contacts:directory': {
      console.log('📞 Contact Directory:');
      const contacts = await agent.getContactDirectory();
      if (contacts.length === 0) {
        console.log('   No contacts in directory yet');
        console.log('   Use "research:contacts" to find contacts');
      } else {
        contacts.forEach(contact => {
          console.log(`\n👤 ${contact.name}`);
          console.log(`   Position: ${contact.position}`);
          console.log(`   Organization: ${contact.organization}`);
          if (contact.email) console.log(`   Email: ${contact.email}`);
          if (contact.phone) console.log(`   Phone: ${contact.phone}`);
          console.log(`   Priority: ${contact.priority}`);
          if (contact.notes) console.log(`   Notes: ${contact.notes}`);
        });
      }
      break;
    }

    case 'office:search': {
      console.log('🏢 Recommended Office Spaces in Oradea:');
      console.log(`
📍 TOP RECOMMENDATIONS:

1. 🏰 ORADEA TECH HUB (FORTRESS)
   Location: Oradea Fortress, Building I, 1st floor
   Type: Historic coworking space
   Benefits: Tech community, networking events, unique location
   Contact: Visit in person at fortress
   Priority: HIGH for tech credibility

2. 🏢 WORK+ OFFICES (CIVIC CENTER) 
   Location: 37 Emanuil Gojdu Square, A5
   Type: Modern private workspace
   Benefits: Fortress views, central location, professional
   Available: 10 desks, 09:00-18:00 weekdays
   Priority: HIGH for professional meetings

3. 🎯 UNIVERSITY OF ORADEA PARTNERSHIP
   Location: Str. Universității 1, Oradea 410087
   Type: Institutional partnership
   Benefits: Research collaboration, student talent, EU credibility
   Contact: Partnership coordinator office
   Priority: STRATEGIC for Portal Oradea

4. 🏛️ CITY HALL PROXIMITY
   Location: Near Piața Unirii nr. 1
   Benefits: Government access, regulatory proximity
   Priority: HIGH for public-private partnerships
      `);
      break;
    }

    default: {
      console.log(`
🏛️ ORADEA BUSINESS DEVELOPMENT AGENT - COMMANDS

📅 Planning & Coordination:
  plan:weekly                     Generate weekly action plan
  partnerships:status             View partnership status overview
  meetings:upcoming              Show upcoming meetings

📞 Contact Management:
  research:contacts [query]       Research and find new contacts
  contacts:directory             View all contacts in directory
  meeting:schedule "Org" purpose  Schedule institutional meeting

🏢 Office & Infrastructure:
  office:search                  Show recommended office spaces

📊 Usage Examples:
  npm run dev:oradea plan:weekly
  npm run dev:oradea research:contacts "mayor office"
  npm run dev:oradea meeting:schedule "University of Oradea" "research partnership"
  npm run dev:oradea partnerships:status

🎯 Focus Areas:
  • Government relations (City Hall, Mayor's office)  
  • Academic partnerships (University of Oradea)
  • Business community (Chamber of Commerce)
  • Office space acquisition (Tech Hub, coworking)
  • EU funding compliance and local legislation
      `);
      break;
    }
  }
}

main().catch(console.error);