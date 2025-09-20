// /Users/apple/Desktop/UBOS_2.0/UBOS/packages/api/src/eufm.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { EUFMPipelineCoordinator, EUFundingRequest } from '../../src/agents/coordinator/eufmPipelineCoordinator';

async function eufmRoutes(app: FastifyInstance) {
  const coordinator = new EUFMPipelineCoordinator('eufm-coordinator', 'eufm-requirement');

  app.post('/api/eufm/analyze', async (req, reply) => {
    const requestBody = req.body as EUFundingRequest;
    // TODO: Get serviceTier from user's subscription
    requestBody.serviceTier = 'pro'; // Mocking for now
    const result = await coordinator.processFundingRequest(requestBody);
    reply.send(result);
  });

  app.post('/api/eufm/search', async (req, reply) => {
    // Placeholder for funding opportunity search
    reply.send({ message: 'Search functionality not yet implemented.' });
  });

  app.post('/api/eufm/generate', async (req, reply) => {
    // Placeholder for proposal generation
    reply.send({ message: 'Proposal generation not yet implemented.' });
  });

  app.get('/api/eufm/opportunities', async (req, reply) => {
    // Placeholder for user's opportunities dashboard
    reply.send({ opportunities: [] });
  });

  app.post('/api/eufm/upgrade', async (req, reply) => {
    // Placeholder for service tier upgrades
    reply.send({ message: 'Service tier upgrades not yet implemented.' });
  });

  app.get('/api/system/health', async (req, reply) => {
    // Placeholder for system health monitoring
    reply.send({ status: 'ok' });
  });

  app.get('/api/system/usage', async (req, reply) => {
    // Placeholder for usage analytics
    reply.send({ usage: 'not yet implemented' });
  });

  app.post('/api/system/agents', async (req, reply) => {
    // Placeholder for agent configuration
    reply.send({ message: 'Agent configuration not yet implemented.' });
  });
}

export const eufmPlugin = fp(eufmRoutes);
